const WIDTH = 1000;
const HEIGHT = 1200;
const MAP_MAGNIFICATE_RATE = 1800;

export default function drawMap(svg, nodes, features, japan){
  features = features;
  var projection = d3.geoMercator()
    .center([137, 34])
    .translate([WIDTH/2, HEIGHT/2])
    .scale(MAP_MAGNIFICATE_RATE);
  nodes
    .transition()
    .duration(3000)
    .attr("cx", d=>projection(d.geometry.coordinates[0])[0])
    .attr("cy", d=>projection(d.geometry.coordinates[0])[1])
    .attr("r", 3)
    .attr("fill", d=>getColor(d));
  function getColor(d) {
    if (d.properties.S12_033 < 100) {
      return "#377DAD"
    } else if (d.properties.S12_033 < 2000) {
      return "#FBE74D"
    } else {
      return "#FB644D"
    }
  }
} 

export function onChangeMap(features, svg, val) {
  let maxPriceStations = [];

  for (let i = 0; i < features.length ; i++){
    if (Number(features[i].properties.S12_036) > Number(val) - 100 && Number(features[i].properties.S12_036) < Number(val) + 100){
      maxPriceStations.push(`${features[i].properties.S12_001}-${features[i].properties.S12_034}`);
    }
  }
  console.log(maxPriceStations)

  svg.selectAll('circle')
    .filter(".node")
    .attr("visibility", "hidden");
  maxPriceStations.forEach((s) => {
    svg.selectAll(`.node-${s}`)
      .attr("visibility", "visible")
  });
}