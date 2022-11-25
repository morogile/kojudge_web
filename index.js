import drawGraph from "./drawGraph.js";
import drawMap from "./drawMap.js";
import { onChangeMap } from "./drawMap.js";
import { onChangeGraph } from "./drawGraph.js";

const WIDTH = 1000;
const HEIGHT = 1200;
const RADIUS = 200;
const CIRCLE_CX = 400;
const CIRCLE_CY = 380;
const MAP_MAGNIFICATE_RATE = 1800;

let windowCount = 0;
let filterState = 0; //1 or 2 or 3

const mapButton = document.getElementById('mapButton');
mapButton.addEventListener('click',onClickMap);

const graphButton = document.getElementById('graphButton');
graphButton.addEventListener('click',onClickGraph);

const legendOver2000 = document.getElementById('legend-over-2000');
const legendOver100 = document.getElementById('legend-over-100');
const legendUnder100 = document.getElementById('legend-under-100');

legendOver2000.addEventListener("click", onClickLegendOver2000);
legendOver100.addEventListener("click", onClickLegendOver100);
legendUnder100.addEventListener("click", onClickLegendUnder100);

createTitle()

var svg = d3.select("#my_dataviz").append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);
var nodes;
var features;
var isMap = true;

const backgroundCircle = svg
    .append("circle")
    .attr("class", "background-circle")
    .classed("clock", true)
    .attr("r", RADIUS)
    .attr("cx", CIRCLE_CX)
    .attr("cy", CIRCLE_CY)
    .style("stroke", "#BEBEBE")
    .style("stroke-width", "1px")
    .style("fill", "white");    

const angleLine = svg
    .append("path")
    .attr("class", "angle-line")
    .classed("clock", true)
    .attr("stroke", "#BEBEBE")
    .attr("stroke-width", "1px")
    .attr("d", `M ${CIRCLE_CX}, ${CIRCLE_CY} h ${RADIUS}`)
    .attr("stroke-dasharray", 4);

const angleText = d3.select("body")
    .append("div")
    .attr("class", "angle-text")
    .classed("clock", true)
    .text("");

const clockDialList = [0,2,4,6,8,10,12,14,16,18,20,22];
svg.selectAll(".clock-dial-path")
    .data(clockDialList)
    .enter()
    .append("path")
    .attr("stroke", "#BEBEBE")
    .style("stroke-width", "1px")
    .attr("class", "clock-dial-path")
    .classed("clock", true)
    .attr("d", d => `M ${calculateDialX(d)}, ${calculateDialY(d)} h 10`)
    .attr("transform", d => `rotate(${360 * d/24 + 90} ${calculateDialX(d)} ${calculateDialY(d)})`)    

svg.selectAll(".clock-dial-text")
    .data(clockDialList)
    .enter()
    .filter((d,i) => i % 3 === 0)
    .append("text")
    .text(d => `${d}`)
    .attr("font-family", "sans-serif")
    .attr("fill", "#BEBEBE")
    .attr("x", d => `${calculateDialX(d)}px`)
    .attr("y", d => `${calculateDialY(d)}px`)
    .attr("transform", d => `translate(${calculateTranslateXY(d)[0]} ${calculateTranslateXY(d)[1]})`)
    .attr("class", "clock-dial-text")
    .classed("clock", true);

svg.selectAll(".clock")
    .on("mouseenter", showAngleLine)
    .on("mousemove", moveAngleLine)
    .on("mouseout", hideAngleLine);

d3.json("./data/japan.topojson").then((data) => {
  var japan = topojson.feature(data, data.objects.japan);
  var projection = d3.geoMercator()
    .center([137, 34])
    .translate([WIDTH/2, HEIGHT/2])
    .scale(MAP_MAGNIFICATE_RATE);
  var japanWhiteMapPath = d3.geoPath().projection(projection);
  svg.selectAll(".japanMap")
    .data(japan.features)
    .enter()
    .append("path")
    .attr("class", "japanMap")
    .attr("d", japanWhiteMapPath)
    .attr("fill","#FFFFFF")
    .style("display", "none");
});

getGeoJson().then(data => {
  features = data.features;
  nodes = svg.selectAll("circle")
    .data(data.features)
    .enter()
    .append("circle")
    .attr("class", d => `node-${d.properties.S12_001}-${d.properties.S12_034}`)
    .classed("node", true)
    .style("cursor", "pointer")
    .on("click", (event, d) => onClickNode(event, d))
  
  // ここら辺のローディングアニメーション入れたい
  console.log(nodes);
  const inputElm = document.getElementById("fare-slider");
  
  resetAll("9500");
  drawGraph(svg,nodes,features);
  onChangeGraph(features,svg,"9500");

  inputElm.addEventListener("input", event => { 
    changeFareAmountText(`${Number(inputElm.value).toLocaleString()}円`);   
    if (isMap) {
      onChangeMap(features, svg, inputElm.value);
    } else {
      onChangeGraph(features, svg, inputElm.value);
    }
  });
});

function onClickGraph() {
  console.log("graph loading started");
  changeTitle("./image/clock_icon.svg", "東京駅からの所要時間")
  graphButton.style.backgroundColor = "#377DAD"
  mapButton.style.backgroundColor = "#D9D9D9"

  svg
    .selectAll(".clock")
    .style("display", "block");
  svg
    .selectAll(".japanMap")
    .style("display", "none");
  isMap = false;
  drawGraph(svg, nodes, features);

  console.log("graph loading ended");
}

function onClickMap() {
  console.log("map loading started");
  changeTitle("./image/japan_icon.svg", "東京駅からどれくらい遠いか")
  mapButton.style.backgroundColor = "#377DAD"
  graphButton.style.backgroundColor = "#D9D9D9"

  svg
    .selectAll(".clock")
    .style("display", "none");
  svg
    .selectAll('.japanMap')
    .style("display", "block");
  isMap = true;
  drawMap(svg, nodes, features);
  console.log("map loading ended");
}

function onClickNode(event, d) {
  createInfoWindow(
    d.properties.S12_001,
    `${d.properties.S12_002}${d.properties.S12_003}`,
    d.properties.S12_034,
    d.properties.S12_035,
    d.properties.S12_036,
    d.properties.S12_038,
    d.properties.S12_039,
    d.properties.S12_031,
    d.properties.S12_033,
    [250 - windowCount * 10, 870 - windowCount * 10]
  );
}

async function getGeoJson() {
  var data;
  await d3.json("./data/data.geojson").then(function (response) {
      data = response;
  })
  return data;
}

function calculateDialX(dial) {
    return CIRCLE_CX + RADIUS * Math.cos(Math.PI / 2 - Math.PI * dial / 12);
}

function calculateDialY(dial) {
    return CIRCLE_CY - RADIUS * Math.sin(Math.PI / 2 - Math.PI * dial / 12);
}

function calculateTranslateXY(dial) {
    switch(dial){
        case 0:
            return [-4,29]
        case 6:
            return [-27,6]
        case 12:
            return [-9,-18]
        case 18:
            return [16,6]
        default:
            return [0,0]
    }
}

function showAngleLine(event, d) {
    angleLine.attr("opacity", 1);
    angleText.style("display", "block");
}

function moveAngleLine(event, d) {
    const abs = Math.sqrt((event.pageX - CIRCLE_CX)**2 + (event.pageY - CIRCLE_CY)**2);
    const innerProduct = -1 * (event.pageY - CIRCLE_CY);    
    const angle_abs = Math.acos(innerProduct / abs)
    const angle = event.pageX > CIRCLE_CX ? angle_abs : -1 * angle_abs + Math.PI * 2;
    const angleTextTranslateX = angle > Math.PI && angle < Math.PI * 2 ? 80 - 80 / (Math.PI/2) * Math.abs(angle - 3*Math.PI/2) : 0; //angleTextとカーソルが被らないようにするための修正
    console.log(angle)
    const hours = Math.floor(angle/Math.PI * 720 / 60)
    const minutes = Math.floor((angle / Math.PI * 720) % 60);
    angleLine.attr("transform", `rotate(${angle / Math.PI * 180 - 90} ${CIRCLE_CX} ${CIRCLE_CY})`);
    d3.selectAll(".angle-text")
        .style("top", `${event.pageY - 80 * Math.cos(angle)}px`)
        .style("left", `${event.pageX + 80 * Math.sin(angle) - angleTextTranslateX}px`)
        .text(`東京駅から${hours}時間${minutes}分`)
    /* angleLine.attr("d", `M ${event.pageX} ${event.pageY} h 10`) */
}

function hideAngleLine(event, d) {
    angleLine.attr("opacity", 0);
    angleText.style("display", "none");
}

function createTitle() {
  const headingDiv = document.createElement("div")
  const titleDiv = document.getElementById("title");
  titleDiv.prepend(headingDiv);
  headingDiv.style.display = "flex";
  headingDiv.style.alignItems = "center";
  headingDiv.style.gap = "16px";
  const iconImage = document.createElement("img");
  iconImage.setAttribute("id", "heading-icon-image")
  iconImage.setAttribute("src", "./image/clock_icon.svg");
  const headingText = document.createElement("p");
  headingText.setAttribute("id", "heading-text")
  headingText.innerText = "東京駅からの所要時間";
  headingDiv.appendChild(iconImage);
  headingDiv.appendChild(headingText);
}

function changeTitle(iconImageSrc, text) {
  const iconImage = document.getElementById("heading-icon-image");
  const headingText = document.getElementById("heading-text");
  iconImage.setAttribute("src", iconImageSrc);
  headingText.innerText = text
}

function changeFareAmountText(text) {
  const fareSliderAmountText = document.getElementById("fare-slider-amount-text");
  fareSliderAmountText.innerText = text;
}

function createInfoWindow(name, line, prefecture, area, fare, distance, minutes, existDataOfPassangers, numOfPassangers, initialPlace) {
  const id = `${name}-${prefecture}-${area}`;
  let isSameNameStation = false;
  windowCount++;

  const windowWrapperDiv = document.createElement("div");
  windowWrapperDiv.style.backgroundColor = "white";
  windowWrapperDiv.style.border = "1px solid #BEBEBE";
  windowWrapperDiv.style.position = "absolute";
  windowWrapperDiv.style.width = "320px";
  windowWrapperDiv.style.top = `${initialPlace[0]}px`;
  windowWrapperDiv.style.left = `${initialPlace[1]}px`;
  windowWrapperDiv.id = id;

  const stationWrapper = document.createElement("div");
  stationWrapper.id = `station-wrapper-${id}`
  stationWrapper.style.display = "flex";
  stationWrapper.style.alignItems = "center";
  stationWrapper.style.justifyContent = "space-between";
  stationWrapper.style.padding = "12px";
  stationWrapper.style.borderBottom = "1px solid #BEBEBE";
  /* stationWrapper.addEventListener("mousedown", event =>  onMouseDown(event,id)); */
  

  const stationNameWrapper = document.createElement("div");
  stationNameWrapper.style.display = "flex";
  stationNameWrapper.style.alignItems = "center";
  stationNameWrapper.style.gap = "12px";

  const stationColorCircle = document.createElement("div");
  stationColorCircle.style.backgroundColor = `${getColor(numOfPassangers)}`;
  stationColorCircle.style.borderRadius = "50%";
  stationColorCircle.style.width = "18px";
  stationColorCircle.style.height = "18px";

  const stationNamePara = document.createElement("p");
  stationNamePara.style.fontSize = "16px";
  stationNamePara.style.margin = "0";
  stationNamePara.innerText = name + "駅";

  const closeButton = document.createElement("button");
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.outline = "none";
  closeButton.style.padding = "0";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", (event) => removeInfoWindow(event, id))

  const closeButtonImage = document.createElement("img");
  closeButtonImage.src = "./image/close_button_icon.svg";
  closeButtonImage.style.width = "18px";
  closeButtonImage.style.height = "18px";

  stationWrapper.append(stationNameWrapper);
  stationNameWrapper.append(stationColorCircle);
  stationNameWrapper.append(stationNamePara);
  stationWrapper.append(closeButton);
  closeButton.append(closeButtonImage);

  const bodyWrapper = document.createElement("div");
  bodyWrapper.style.width = "100%";
  bodyWrapper.style.padding = "12px";
  bodyWrapper.style.display = "flex";
  bodyWrapper.style.flexDirection = "column";
  bodyWrapper.style.gap = "24px";

  const trainWrapper = document.createElement("div");
  trainWrapper.style.display = "flex";
  trainWrapper.style.gap = "8px";
  trainWrapper.style.alignItems = "center";
  
  const trainIcon = document.createElement("img");
  trainIcon.src = "./image/train_icon.svg";

  const trainText = createInfoWindowText(line);

  trainWrapper.append(trainIcon);
  trainWrapper.append(trainText);

  const mapPinWrapper = document.createElement("div");
  mapPinWrapper.style.display = "flex";
  mapPinWrapper.style.gap = "8px";
  mapPinWrapper.style.alignItems = "center";

  const mapPinIcon = document.createElement("img");
  mapPinIcon.src = "./image/map_pin_icon.svg";

  const cityText = createInfoWindowText(`${prefecture}${area}`);

  mapPinWrapper.append(mapPinIcon);
  mapPinWrapper.append(cityText);

  const fareKey = createInfoWindowText("東京駅からの運賃");
  const fareVal = createInfoWindowText(`${Number(fare).toLocaleString()}円`);
  const distanceKey = createInfoWindowText("東京駅からの距離");
  const distanceVal = createInfoWindowText(`${distance}km`);
  const timeKey = createInfoWindowText("東京駅からかかる時間");
  const timeVal = createInfoWindowText(`${Math.floor(minutes / 60)}時間${Math.floor(minutes % 60)}分`);
  const passangersKey = createInfoWindowText("乗降客数");
  const passangersVal = createInfoWindowText(getNumOfpassangers(existDataOfPassangers, numOfPassangers));
  function getNumOfpassangers(existDataOfPassangers, numOfPassangers){
    switch(existDataOfPassangers){
      case 1:
        return `${Number(numOfPassangers).toLocaleString()}人/日`;
      case 2:
        return "データなし";
      case 3:
        return "非公開";
      case 4:
        return "駅なし";
      default:
        return "未定義";
    }
  }

  sameNameStationArray.forEach((station) => {
    if (name == station) {
      isSameNameStation = true;
    }
  })

  const moreInfoAnchor = document.createElement("a");
  moreInfoAnchor.href = isSameNameStation ? 
  `https://transit.yahoo.co.jp/search/print?from=%E6%9D%B1%E4%BA%AC%E9%A7%85&flatlon=&to=${name}(${prefecture})&shin=1`:
  `https://transit.yahoo.co.jp/search/print?from=%E6%9D%B1%E4%BA%AC%E9%A7%85&flatlon=&to=${name}&shin=1`;
  moreInfoAnchor.target = "_blank";
  moreInfoAnchor.rel = "noopener noreferrer";
  moreInfoAnchor.style.fontFamily = "'Noto Sans JP' sans-serif";
  moreInfoAnchor.style.fontSize = "12px";
  moreInfoAnchor.style.color = "#377DAD";
  moreInfoAnchor.style.cursor = "pointer";
  moreInfoAnchor.innerText = "Yahoo乗り換え案内でルートを見る >"
  
  let infoGroups = [];
  for (let i = 0; i < 3; ++i){
    infoGroups[i] = createInfoGroup()
  }
  
  infoGroups[0].append(trainWrapper);
  infoGroups[0].append(mapPinWrapper);
  infoGroups[1].append(createAndAppendInfoGroupInnerBox(fareKey,fareVal));
  infoGroups[1].append(createAndAppendInfoGroupInnerBox(distanceKey,distanceVal));
  infoGroups[1].append(createAndAppendInfoGroupInnerBox(timeKey,timeVal));
  infoGroups[1].append(createAndAppendInfoGroupInnerBox(passangersKey,passangersVal));
  infoGroups[2].append(moreInfoAnchor);

  bodyWrapper.append(...infoGroups);

  windowWrapperDiv.append(stationWrapper);
  windowWrapperDiv.append(bodyWrapper);

  document.getElementById("background").append(windowWrapperDiv);

}

function createInfoGroup() {
  const infoGroup = document.createElement("div");
  infoGroup.style.display = "flex";
  infoGroup.style.flexDirection = "column";
  infoGroup.style.gap = "8px";
  return infoGroup;
}

function createAndAppendInfoGroupInnerBox(key,val) {
  const keyValWrapper = document.createElement("div");
  keyValWrapper.style.display = "flex";
  const keyDiv = document.createElement("div");
  keyDiv.style.width = "160px";
  keyDiv.append(key);
  keyValWrapper.append(keyDiv);
  keyValWrapper.append(val);
  return keyValWrapper;
}

function createInfoWindowText(text) {
  const infoWindowtext = document.createElement("p");
  infoWindowtext.style.fontSize = "14px";
  infoWindowtext.style.lineHeight = "1.6";
  infoWindowtext.style.color = "#787878";
  infoWindowtext.style.letterSpacing = "1.04";
  infoWindowtext.style.margin = "0";
  infoWindowtext.innerText = text;
  return infoWindowtext;
}

function getColor(numOfPassangers) {
  if (numOfPassangers < 100) {
    return "#377DAD"
  } else if (numOfPassangers < 2000) {
    return "#FBE74D"
  } else {
    return "#FB644D"
  }
}

function removeInfoWindow(event, id) {
  document.getElementById(id).remove();
  windowCount--;
}

function resetAll(defaultInputValue) {
  changeTitle("./image/clock_icon.svg", "東京駅からの所要時間")
  graphButton.style.backgroundColor = "#377DAD"
  mapButton.style.backgroundColor = "#D9D9D9"
  isMap = false;
  
  changeFareAmountText(`${Number(defaultInputValue).toLocaleString()}円`);
  const inputElm = document.getElementById("fare-slider");
  inputElm.value = defaultInputValue;
}



//マウス移動にウィンドウが追従するようにしたかった
function onMouseDown(event, id) {
  const stationWrapper = document.getElementById(`station-wrapper-${id}`);
  const windowWrapperDiv = document.getElementById(id);

  let adjustX = event.clientX - stationWrapper.getBoundingClientRect().left + windowWrapperDiv.getBoundingClientRect().left;
  let adjustY = event.clientY - stationWrapper.getBoundingClientRect().top + windowWrapperDiv.getBoundingClientRect().top;
  stationWrapper.addEventListener("mousemove", onMouseMoveEvent);
  stationWrapper.removeEventListener("mouseup", onMouseMoveEvent);

  function onMouseMoveEvent(event) {
    onMouseMove(event,id, adjustX, adjustY)
  }
}

function onMouseMove(event, id, adjustX, adjustY) {
  const div = document.getElementById(id);
  div.style.left = `${event.clientX - adjustX}px`;
  div.style.top = `${event.clientY - adjustY}px`;
}

const sameNameStationArray = [
  "相生","相生","愛野","愛野","青海","青山","青山","青山","赤池","赤池","赤池","赤坂","赤坂","赤坂","赤坂","上道","明智","明智","朝倉","朝倉","旭","旭","旭ヶ丘","旭ケ丘","足柄","足柄","味美","味美","愛宕","愛宕","穴川","穴川","穴太","穴太","我孫子","我孫子","新井","荒井","荒井","荒尾","荒尾","新屋","新屋","有明","有明","有馬温泉","有馬温泉","粟津","粟津","生田","池田","池田","池田","石井","石井","石川","石川","石田","石田","泉","泉","磯部","磯部","伊丹","伊丹","市場","市場","市場","一本松","一本松","稲荷町","稲荷町","井野","井野","井口","井口","今池","今池","今川","今川","今津","今津","入野","入谷","入谷","岩倉","岩倉","岩倉","岩屋","岩屋","植田","植田","牛田","牛田","牛田","内海","内海","梅林","梅屋敷","梅屋敷","浦田","浦田","浦安","浦安","運動公園","運動公園","江田","江田","榎戸","榎戸","追分","追分","追分","追分","扇町","扇町","青海","大泉","大泉","大泉","大江","大江","大河原","大河原","大久保","大久保","大久保","大久保","大倉山","大倉山","大桑","大桑","大阪梅田","大阪梅田","大沢","大沢","大島","大島","太田","太田","大谷","大谷","大塚","大塚","大手町","大手町","大原","大原","大原","大町","大町","大町","大町","大宮","大宮","大村","大村","大森","大森","大山","大山","大山寺","大和田","大和田","大和田","岡田","岡田","岡本","岡本","岡本","小川","小川","小川町","小川町","小倉","小田","小田","落合","落合","小野","小野","小野","小野","小野","小俣","小林","小俣","小柳","卸町","卸町","大和田","貝塚","貝塚","柏原","学園前","学園前","学園前","柏原","柏原","春日","春日","春日井","春日井","春日野道","春日野道","霞ヶ丘","霞ヶ丘","霞ヶ関","霞ケ関","加太","桂川","金島","金山","金山","金山","金島","加納","加納","蒲池","加太","蒲池","上条","上条","上牧","亀山","亀山","加茂","加茂","加茂","川内","川内","川西","川西","川東","川東","川村","川村","観音寺","神前","神田","観音寺","神戸","上牧","祇園","祇園","菊川","菊川","北方","北方","北河内","北河内","北野","北野","北浜","北浜","北山","北山","北山","喜多山","喜多山","北山田","北山田","木津","木津","城崎温泉","城崎温泉","球場前","球場前","京橋","京橋","桐原","桐原","草津","草津","草薙","草薙","草野","草野","九条","九条","九条","下松","国見","国見","久保田","久保田","弘明寺","弘明寺","黒井","黒井","黒石","黒石","黒川","黒川","黒川","黒川","黒川","黒沢","黒沢","黒田","黒田","黒松","黒松","桂川","県庁前","県庁前","県庁前","県庁前","府中","国府","神前","神代","神代","高田","神田","神戸","江南","江南","光風台","光風台","神戸","江北","江北","高野","郡山","郡山","黄金","黄金","国際センター","国際センター","国府","国分","国分","小倉","五条","五条","琴似","琴似","こどもの国","こどもの国","小林","小林","古見","古見","小柳","御領","御領","西条","栄","栄","栄","栄町","栄町","栄町","栄町","坂本","桜","桜","桜井","桜井","桜井","桜川","桜川","桜木","桜木","桜木町","桜木町","桜沢","桜沢","桜台","桜台","篠原","三郷","三郷","山上","山上","三条","三条","三条","三田","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山頂","山王","山王","三本松","三本松","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","山麓","志井","志井","塩屋","塩屋","東雲","東雲","篠原","島田","島田","清水","清水","清水","下松","下山","下山","市役所前","市役所前","市役所前","十条","十条","十条","生田","上道","庄内","庄内","城野","城野","昭和町","昭和町","昭和町","白沢","白沢","白沢","白山","白石","白石","白石","白石","新川","新川","新郷","新栄町","新栄町","神代","新田","新田","新富士","新富士","森林公園","森林公園","吹田","吹田","末広町","末広町","杉田","杉田","住吉","住吉","住吉","住吉","関","関","関屋","関屋","瀬田","瀬田","川内","曽根","曽根","大学前","大学前","醍醐","醍醐","大山寺","大正","大正","大門","大門","大門","高岩","高岩","高尾","高尾","高砂","高砂","高瀬","高瀬","高田","高田","高田","高田","高田","高津","高津","高野","高浜","高浜","高浜","高松","高松","高松","高宮","高宮","滝","滝","滝谷","滝谷","竹田","竹田","多田","多田","立野","立野","田野","田野","玉川","玉川","田原町","田原町","千里","千里","千歳","千歳","千鳥町","千鳥町","千早","千早","茶山","茶山","中田","月岡","月岡","土橋","筒井","筒井","つつじヶ丘","つつじヶ丘","寺田","寺田","展望台","展望台","十日市場","十日市場","十川","十川","常盤","常盤","常盤","ときわ台","ときわ台","徳田","徳田","戸田","戸田","土橋","泊","泊","泊","富浦","富浦","富田","富田","豊岡","豊岡","豊川","豊川","豊津","豊津","富田","長浦","長浦","長尾","長尾","中川","中川","中島","中島","中田","中田","永田","永田","長田","長田","中津","中津","長沼","長沼","中野","中野","中野","長原","長原","渚","渚","成島","成島","名和","名和","新井","新里","新郷","仁井田","仁井田","新野","新里","西条","西原","西原","西山","西山","新川","日進","日進","日進","新田","新田","日本橋","日本橋","入野","額田","額田","根岸","根岸","野崎","野崎","梅林","萩原","萩原","白山","白山","羽黒","羽黒","橋本","橋本","橋本","橋本","長谷","長谷","八幡","八幡前","八幡前","花園","花園","羽場","羽場","原","原","原","原田","原田","番田","番田","万博記念公園","万博記念公園","東新川","東新川","東野","東野","東松江","東松江","東山","東山","東山公園","東山公園","日野","日野","日野","日比野","日比野","瓢箪山","瓢箪山","日吉","日吉","比良","比良","平井","平井","平岸","平岸","平田","平田","平田","平野","平野","平野","平林","平林","広野","広野","吹上","吹上","福井","福井","福島","福島","福野","福野","藤が丘","藤が丘","藤崎","藤崎","伏見","伏見","富士見町","富士見町","府中","府中","府中","船岡","船岡","船津","船津","古市","古市","古市","平田","平和台","平和台","戸田","別府","別府","別府","星ヶ丘","星ヶ丘","星川","星川","細谷","細谷","保田","保田","本宮","本郷","本郷","本郷","本郷","牧","牧","松尾","松尾","松尾","松ヶ崎","松ヶ崎","松崎","松崎","松原","松原","松山","松山","丸山","丸山","丸山","御影","御影","三川","三川","三国","三国","御厨","御厨","三郷","三沢","三田","三谷","三谷","三沢","緑が丘","緑が丘","緑が丘","南方","南方","南桜井","南桜井","宮内","宮内","宮内","妙法寺","妙法寺","武佐","武佐","村上","村上","村山","村山","本宿","本宿","元町","元町","本宮","本山","本山","本山","元山","元山","森","森","森下","森下","森下","守山","守山","薬師堂","薬師堂","八坂","八坂","安田","安田","矢田","矢田","柳津","柳津","梁川","梁川","柳原","柳原","柳原","八幡","山口","山口","山崎","山崎","山崎","山下","山下","山下","山田","山田","山田","大和","大和","山ノ内","山ノ内","山本","山本","八幡","柚木","柚木","横川","横川","横倉","横倉","横山","横山","吉井","吉井","吉田","吉田","吉富","吉富","吉野","吉野","吉浜","吉浜","六軒","六軒","若林","若林","渡瀬","渡瀬"
]

function onClickLegendOver2000(event, d) {
  if(filterState === 0) {
    onFilterOver2000();
    legendOver100.style.opacity = 0.2;
    legendUnder100.style.opacity = 0.2;
    filterState = 1;
  } else if (filterState === 1) {
    resetFilterOver2000();
    legendOver100.style.opacity = 1;
    legendUnder100.style.opacity = 1;
    filterState = 0;
  }
}
function onClickLegendOver100(event, d) {
  if(filterState === 0) {
    onFilterOver100();
    legendOver2000.style.opacity = 0.2;
    legendUnder100.style.opacity = 0.2;
    filterState = 2;
  } else if (filterState === 2) {
    resetFilterOver100();
    legendOver2000.style.opacity = 1;
    legendUnder100.style.opacity = 1;
    filterState = 0;
  }
}
function onClickLegendUnder100(event, d) {
  if(filterState === 0) {
    onFilterUnder100();
    legendOver2000.style.opacity = 0.2;
    legendOver100.style.opacity = 0.2;
    filterState = 3;
  } else if (filterState === 3) {
    resetFilterUnder100();
    legendOver2000.style.opacity = 1;
    legendOver100.style.opacity = 1;
    filterState = 0;
  }
}

function onFilterOver2000() {
  svg.selectAll(".node")
    .filter((d,i) => Number(d.properties.S12_033) < 2000)
    .classed("over-2000-station",true)
    .attr("opacity", 0);
}
function onFilterOver100() {
  svg.selectAll(".node")
    .filter((d,i) => Number(d.properties.S12_033) < 100 || Number(d.properties.S12_033) >= 2000)
    .classed("over-100-station",true)
    .attr("opacity", 0);
}
function onFilterUnder100() {
  svg.selectAll(".node")
    .filter((d,i) => Number(d.properties.S12_033) >= 100)
    .classed("under-100-station",true)
    .attr("opacity", 0);
}

function resetFilterOver2000() {
  svg.selectAll(".over-2000-station")
    .classed("over-2000-station",false)
    .attr("opacity", 1);
}
function resetFilterOver100() {
  svg.selectAll(".over-100-station")
    .classed("over-100-station",false)
    .attr("opacity", 1);
}
function resetFilterUnder100() {
  svg.selectAll(".under-100-station")
    .classed("under-100-station",false)
    .attr("opacity", 1);
}