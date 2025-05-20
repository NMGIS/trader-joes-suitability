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
    query.outFields = ['GEOID', 'H0010001'];
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

        let total = 0;
        const selected = [];
        for (const f of features) {
            const h = f.attributes.H0010001 || 0;
            total += h;
            selected.push(f);
            if (total >= householdTarget) break;
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
                    color: [255, 165, 0, 0.4],
                    outline: { color: '#000', width: 1 }
                }
            })
        );

        onResult(graphics, total);
    } catch (err) {
        console.error('Error selecting block groups:', err);
    }
}
