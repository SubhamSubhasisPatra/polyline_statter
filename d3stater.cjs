const d3 = require("d3");
const fs = require("fs");
const { JSDOM } = require("jsdom");

function generatePieChart() {
  const dom = new JSDOM(
    `<!DOCTYPE html><body><div id="my_dataviz"></div></body>`,
    { pretendToBeVisual: true }
  );

  let body = d3.select(dom.window.document.querySelector("#my_dataviz"));

  let width = 450;
  let height = 450;
  let marin = 60;
  let radius = Math.min(width, height) / 2 - marin;

  var svg = body
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "-35 -25 550 550")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var data = {
    MacOS: 29,
    ios: 20,
    Windows: 30,
    Linux: 8,
    Android: 12,
    iPadOS: 12,
    KaliLinux: 123,
    ArchLinux: 214,
  };

  // set the color scale
  var color = d3
    .scaleOrdinal()
    // .domain(["MacOS", "ios", "Windows", "Linux", "Android","iPadOS"])
    .range(d3.schemeDark2);

  // Compute the position of each group on the pie:
  var pie = d3
    .pie()
    .sort(null)
    .value((d) => d[1]);

  var data_ready = pie(Object.entries(data));
  console.log(data_ready);

  var arc = d3
    .arc()
    .innerRadius(radius * 0.0) // This is the size of the donut hole
    .outerRadius(radius * 0.8);

  // Another arc that won't be drawn. Just for labels positioning
  var outerArc = d3
    .arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  svg
    .selectAll("allSlices")
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data[1]))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7);

  // Add the polylines between chart and labels:
  svg
    .selectAll("allPolylines")
    .data(data_ready)
    .enter()
    .append("polyline")
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr("points", function (d) {
      var posA = arc.centroid(d); // line insertion in the slice
      var posB = outerArc.centroid(d); // line break: we use the other arc generator that has been built only for that
      var posC = outerArc.centroid(d); // Label position = almost the same as posB
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2; // we need the angle to see if the X position will be at the extreme right or extreme left
      posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
      return [posA, posB, posC];
    });

  // Add the polylines between chart and labels:
  svg
    .selectAll("allLabels")
    .data(data_ready)
    .enter()
    .append("text")
    .text((d) => d.data[0])
    .attr("transform", function (d) {
      var pos = outerArc.centroid(d);
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
      pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
      return "translate(" + pos + ")";
    })
    .style("text-anchor", function (d) {
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
      return midangle < Math.PI ? "start" : "end";
    });

  // console.log(body.html());
  fs.writeFileSync("arc_final.svg", body.html());
  return body.html();
}

// module.exports = generatePieChart();
// console.log(generatePieChart())

// generateLineChart

function generateLineChart() {
  const dom = new JSDOM(
    `<!DOCTYPE html><body><div id="my_dataviz"></div></body>`,
    { pretendToBeVisual: true }
  );

  // set the dimentions and margin
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 400 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  let body = d3.select(dom.window.document.querySelector("#my_dataviz"));
  var svg = body
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", "-35 -25 550 550")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  //Read the data
  const data = require("./data.json");

  // group the data: I want to draw one line per group
  const sumstat = d3.group(data, (d) => d.name); // nest function allows to group the calculation per level of a factor

  // Add X axis --> it is a date format
  const x = d3
    .scaleLinear()
    .domain(
      d3.extent(data, function (d) {
        return d.year;
      })
    )
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5));

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return +d.n;
      }),
    ])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // color palette
  const color = d3
    .scaleOrdinal()
    .range(d3.schemeDark2);

  // Draw the line
  svg
    .selectAll(".line")
    .data(sumstat)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", function (d) {
      return color(d[0]);
    })
    .attr("stroke-width", 1.5)
    .attr("d", function (d) {
      return d3
        .line()
        .x(function (d) {
          return x(d.year);
        })
        .y(function (d) {
          return y(+d.n);
        })(d[1]);
    });

    fs.writeFileSync("liner_graph.svg", body.html());
//   console.log(body.html());
    return body.html()
}

generateLineChart();
