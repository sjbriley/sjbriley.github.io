(function() {

  const stateMap = {};
  const fipsToState = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY"
  };

  let topoDataPromise;
  async function loadTopo() {
    if (!topoDataPromise) {
      topoDataPromise = d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
    }
    return topoDataPromise;
  }

  stateMap.draw = async function(containerSelector, aggregatedByState, options = {}) {
    const width = options.width || 600;
    const height = options.height || 400;

    d3.select(containerSelector).select('svg').remove();

    const svg = d3.select(containerSelector).append('svg')
      .attr('width', width)
      .attr('height', height);

    const topo = await loadTopo();
    const features = topojson.feature(topo, topo.objects.states).features;

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width * 1.25);
    const path = d3.geoPath().projection(projection);

    const values = Object.values(aggregatedByState);
    const maxVal = d3.max(values);
    const colour = d3.scaleSequential(d3.interpolateOrRd)
      .domain([0, maxVal || 1]);

    svg.append('g')
      .selectAll('path')
      .data(features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const code = fipsToState[d.id];
        const val = aggregatedByState[code] || 0;
        return val > 0 ? colour(val) : '#eeeeee';
      })
      .attr('stroke', '#aaaaaa')
      .attr('stroke-width', 0.5)
      .append('title')
      .text(d => {
        const code = fipsToState[d.id];
        const val = aggregatedByState[code] || 0;
        return code ? `${code}: ${val.toLocaleString()}` : '';
      });

    svg.append('path')
      .datum(topojson.mesh(topo, topo.objects.states, (a, b) => a !== b))
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-linejoin', 'round')
      .attr('d', path);

    return svg;
  };

  window.stateMap = stateMap;
})();
