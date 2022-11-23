// const WIDTH = 940;
// const HEIGHT = 1500;
const RADIUS = 200;
const CIRCLE_CX = 400;
const CIRCLE_CY = 380;

var inputElm;
var pElm;

export default function drawGraph(svg, nodes, features) {
    /* const texts = svg
        .selectAll("nodetext")
        .data(features).enter()
        .append("text")
        .text(d => d.properties.S12_001)
        .attr("class", "nodetext")
        .classed(d => `nodetext-${d.properties.S12_001}-${d.properties.S12_034}`, true)
        .attr("x", d => calculateCx(Number(d.properties.S12_039)) + 10)
        .attr("y", d => calculateCy(Number(d.properties.S12_039)) + 10)
        .style("fontFamily", "sans-serif")
        .attr("font-size", d => calculateFontSize(d.properties.S12_033, d.properties.S12_031))
        .attr("fill", "black"); */

    /* onChangeGraph(features, svg); */
    nodes
        .transition()
        .duration(3000)
        .attr("cx", d => calculateCx(Number(d.properties.S12_039)))
        .attr("cy", d => calculateCy(Number(d.properties.S12_039)))
        .attr("r", d => calculateNodeRadius(d.properties.S12_033, d.properties.S12_031));
    nodes
        .style("fill", d => getColor(d))
        .attr("stroke", "black")
        .attr("stroke-width", 0.3)
        .sort(order)
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    const tooltip = d3.select("body")
        .append("p")
        .attr("class", "tooltip");

    function showTooltip (event, d) {
      tooltip
        .style("visibility", "visible")
        .html(d.properties.S12_001);
      d3.select(event.currentTarget)
        .style("fill", d => getDarkColor(d));      
    }

    function moveTooltip (event, d) {
      tooltip
        .style("top", (event.pageY - 20) + "px")
        .style("left", (event.pageX + 10) + "px");        
    }

    function hideTooltip(event, d) {
      tooltip
        .style("visibility", "hidden");
      d3.select(event.currentTarget)
        .style("fill", d => getColor(d));
    }
    

    function calculateCx(minutes) {
    const angle = 2 * Math.PI * (0.25 - minutes / (24 * 60));
    return CIRCLE_CX + RADIUS * Math.cos(angle);
    }

    function calculateCy(minutes) {
    const angle = 2 * Math.PI * (0.25 - minutes / (24 * 60));
        return CIRCLE_CY - RADIUS * Math.sin(angle);
    }

    function calculateNodeRadius(passangers, existData) {
        if (existData == 1) {
            return Math.log2(passangers ? passangers : 1);
        }
        else {
            return 0;
        }
    }

    function calculateFontSize(passangers, existData) {
        if (existData == 1) {
            return Math.log2(passangers == 0 ? passangers : 1);
        }
        else {
            return 0;
        }
    }

    function order(a,b) {
        if (a == null) {
            console.log(a);
        }
        return Number(b.properties.S12_033) - Number(a.properties.S12_033)
    }

    function getColor(d) {
        if (d.properties.S12_033 < 100) {
            return "#377DAD"
        } else if (d.properties.S12_033 < 2000) {
            return "#FBE74D"
        } else {
            return "#FB644D"
        }
    }

    function getDarkColor(d) {
      if (d.properties.S12_033 < 100) {
        return "#2F6A93"
      } else if (d.properties.S12_033 < 2000) {
        return "#D5C441"
      } else {
        return "#D55541"
      }
    }
}

export function onChangeGraph(features, svg, val) {
    let maxPriceStations = [];

    for (let i = 0; i < features.length ; i++){
        if (Number(features[i].properties.S12_036) > Number(val) - 50 && Number(features[i].properties.S12_036) < Number(val) + 50){
            maxPriceStations.push(`${features[i].properties.S12_001}-${features[i].properties.S12_034}`);
        }
    }
    console.log("maxPriceStation")
    console.log(maxPriceStations)

    //ノードの操作
    svg.selectAll("circle")
    .filter(".node")
    .attr("visibility", "hidden");
    svg.selectAll(".nodetext")
    .attr("visibility", "hidden");
    maxPriceStations.forEach((s) => {
        console.log(s);
    svg.selectAll(`.node-${s}`)
        .attr("fill-opacity", 1)
        .attr("stroke-width", 0.3)
        .attr("visibility", "visible");
    svg.selectAll(`.nodetext-${s}`)
        .attr("visibility", "visible")
    });
    console.log('done')
}

/* 
var svg = d3.select("body").append("svg")
    .attr("width", 2000)
    .attr("height", 1500)
    .attr("fill", "black");
getDatas().then(value => {
    console.log(value);
})

async function getDatas() {
    var stationData = await getTopoJson();
    console.log({stationData});
    return "finish";
}

async function getTopoJson() {
    var data;
    await d3.json("./station.topojson").then(function (response) {
        var japan = topojson.feature(data, data.objects.line_map);
        data = response;
        return;
    });
    return data;
}

function getFareData() {
    console.log("hwllo");
} */