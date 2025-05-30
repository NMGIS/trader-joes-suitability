export async function selectNearbyBlockGroups({
  center,
  layer,
  view,
  householdTarget,
  onResult,
  isComparison = false
}) {
  if (!center || !layer || !view || !householdTarget || !onResult) return;

  const query = layer.createQuery();
  query.returnGeometry = true;
  query.outFields = [
    'GEOID',
    'H0010001',
    'P0010001',
    'P0130001',
    'P017_calc_numAlone',
    'P001_calc_pctPopDensity',
    'Shape__Area'
  ];
  query.geometry = center;
  query.distance = 50;
  query.units = 'miles';
  query.spatialRelationship = 'intersects';

  try {
    const result = await layer.queryFeatures(query);
    const features = result.features
      .map(f => {
        f.distance = Math.sqrt(
          Math.pow(center.latitude - f.geometry.latitude, 2) +
          Math.pow(center.longitude - f.geometry.longitude, 2)
        );
        return f;
      })
      .sort((a, b) => a.distance - b.distance);

    let totalHouseholds = 0;
    let totalPop = 0;
    let totalAlone = 0;
    let weightedAgeSum = 0;
    let weightedPopSum = 0;
    let popDensitySum = 0;
    let popDensityCount = 0;
    let totalAreaSqMi = 0;

    const selected = [];

    for (const f of features) {
      const h = f.attributes.H0010001 || 0;
      totalHouseholds += h;
      selected.push(f);

      const pop = f.attributes.P0010001 || 0;
      totalPop += pop;
      totalAlone += f.attributes.P017_calc_numAlone || 0;

      const medianAge = f.attributes.P0130001;
      if (medianAge !== null && medianAge !== undefined && pop > 0) {
        weightedAgeSum += medianAge * pop;
        weightedPopSum += pop;
      }

      const popDensity = f.attributes.P001_calc_pctPopDensity;
      if (popDensity !== null && popDensity !== undefined) {
        const converted = popDensity * 2.58999;
        popDensitySum += converted;
        popDensityCount++;
      }

      const areaMeters = f.attributes.Shape__Area || 0;
      const areaMi = areaMeters / 2_589_988.11;
      totalAreaSqMi += areaMi;

      if (totalHouseholds >= householdTarget) break;
    }

    const [geometryEngine, Graphic, FeatureLayer] = await new Promise((resolve) => {
      window.require(
        ['esri/geometry/geometryEngine', 'esri/Graphic', 'esri/layers/FeatureLayer'],
        (...modules) => resolve(modules)
      );
    });
    const extent = geometryEngine.union(selected.map(f => f.geometry)).extent;

    const incomeLayer = new FeatureLayer({
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Median_Income_by_Race_and_Age_Selp_Emp_Boundaries/FeatureServer/2',
      outFields: ['GEOID', 'B19049_001E', 'B19053_001E']
    });

    const incomeQuery = incomeLayer.createQuery();
    incomeQuery.geometry = extent;
    incomeQuery.spatialRelationship = 'intersects';
    incomeQuery.returnGeometry = true;
    incomeQuery.outFields = ['GEOID', 'B19049_001E', 'B19053_001E'];

    const incomeResult = await incomeLayer.queryFeatures(incomeQuery);

    let weightedIncomeSum = 0;
    let totalHouseholdWeight = 0;

    incomeResult.features.forEach(incomeFeat => {
      const income = incomeFeat.attributes.B19049_001E;
      const households = incomeFeat.attributes.B19053_001E || 0;

      if (income != null && households > 0) {
        weightedIncomeSum += income * households;
        totalHouseholdWeight += households;
      }
    });

    const avgMedianIncome = totalHouseholdWeight > 0
      ? weightedIncomeSum / totalHouseholdWeight
      : null;


    const eduLayer = new FeatureLayer({
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Educational_Attainment_Boundaries/FeatureServer/2',
      outFields: ['GEOID', 'B15002_calc_pctGEBAE', 'B15002_001E']
    });



    const eduQuery = eduLayer.createQuery();
    eduQuery.geometry = extent;
    eduQuery.spatialRelationship = 'intersects';
    eduQuery.returnGeometry = true;
    eduQuery.outFields = ['GEOID', 'B15002_calc_pctGEBAE', 'B15002_001E'];

    const eduResult = await eduLayer.queryFeatures(eduQuery);

    let weightedPctSum = 0;
    let totalEligiblePop = 0;

    eduResult.features.forEach(eduFeat => {
      const tractGeom = eduFeat.geometry;
      const pct = eduFeat.attributes.B15002_calc_pctGEBAE;
      const eligible = eduFeat.attributes.B15002_001E;

      if (pct != null && eligible != null && eligible > 0) {
        const intersects = selected.some(f => geometryEngine.intersects(f.geometry, tractGeom));
        if (intersects) {
          weightedPctSum += pct * eligible;
          totalEligiblePop += eligible;
        }
      }
    });

    const avgEduPct = totalEligiblePop > 0 ? (weightedPctSum / totalEligiblePop) : null;

    const graphics = selected.map(f =>
      new Graphic({
        geometry: f.geometry,
        attributes: f.attributes,
        symbol: {
          type: 'simple-fill',
          color: [0, 0, 0, 0],
          outline: {
            color: isComparison ? [0, 102, 255] : [255, 0, 0],
            width: 2
          }
        }
      })
    );

    const demographics = {
      totalPop,
      totalAlone,
      avgMedianAge: weightedPopSum > 0 ? (weightedAgeSum / weightedPopSum) : 0,
      avgPopDensity: totalAreaSqMi > 0 ? (totalPop / totalAreaSqMi) : 0,
      avgMedianIncome,
      avgEduPct,
      totalAreaSqMi
    };

    onResult(graphics, totalHouseholds, demographics);
  } catch (err) {
    console.error('Error selecting block groups or querying education data:', err);
  }
}
