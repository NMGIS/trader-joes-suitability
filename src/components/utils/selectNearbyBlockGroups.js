// Utility function to select census block groups near a point up to a household threshold
export async function selectNearbyBlockGroups({
    center,
    layer,
    view,
    householdTarget,
    onResult
}) {
    if (!center || !layer || !view || !householdTarget || !onResult) return;

    const query = layer.createQuery();
    query.returnGeometry = true;
    query.outFields = [
        'GEOID',
        'H0010001', // Total Households
        'P0010001', // Total population
        'P0130001', // Median age
        'P017_calc_numAlone', // People living alone
        'P001_calc_pctPopDensity' // Population density
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

            if (totalHouseholds >= householdTarget) break;
        }

        const Graphic = await new Promise((resolve) => {
            window.require(['esri/Graphic'], (g) => resolve(g));
        });

        const graphics = selected.map(f =>
            new Graphic({
                geometry: f.geometry,
                attributes: f.attributes,
                symbol: {
                    type: 'simple-fill',
                    color: [0, 0, 0, 0], // transparent fill
                    outline: {
                        color: [255, 0, 0], // red outline
                        width: 2
                    }
                }
            })
        );

        const demographics = {
            totalPop,
            totalAlone,
            avgMedianAge: weightedPopSum > 0 ? (weightedAgeSum / weightedPopSum) : 0,
            avgPopDensity: popDensityCount > 0 ? (popDensitySum / popDensityCount) : 0
        };

        onResult(graphics, totalHouseholds, demographics);
    } catch (err) {
        console.error('Error selecting block groups:', err);
    }
}
