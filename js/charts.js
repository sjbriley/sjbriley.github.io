(function() {
  const charts = {};

  charts.lineChart = function(containerSelector, data, options = {}) {
    const {
      xKey = 'x',
      yKey = 'y',
      xLabel = '',
      yLabel = '',
      color = 'steelblue',
      width = 1000,
      height = 500
    } = options;

    d3.select(containerSelector).select('svg').remove();

    const margin = {top: 60, right: 40, bottom: 100, left: 120};
    const svg = d3.select(containerSelector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d[xKey]))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])]).nice()
      .range([chartHeight, 0]);

    const line = d3.line()
      .x(d => x(d[xKey]))
      .y(d => y(d[yKey]));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x)
              .ticks(Math.min(10, data.length))
              .tickFormat(d3.format('d')));

    g.append('g')
      .call(d3.axisLeft(y));

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .text(xLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .text(yLabel);

    return { svg, x, y, margin };
  };

  charts.barChart = function(containerSelector, data, options = {}) {
    const {
      xKey = 'category',
      yKey = 'value',
      xLabel = '',
      yLabel = '',
      color = 'orange',
      width = 1000,
      height = 500
    } = options;

    d3.select(containerSelector).select('svg').remove();

    const margin = {top: 60, right: 40, bottom: 100, left: 120};
    const svg = d3.select(containerSelector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, chartWidth])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])]).nice()
      .range([chartHeight, 0]);

    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d[xKey]))
      .attr('y', d => y(d[yKey]))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d[yKey]))
      .attr('fill', color);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('dx', '-0.5em')
        .attr('dy', '0.25em')
        .style('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(y));

    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 60)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .text(xLabel);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .text(yLabel);

    return { svg, x, y, margin };
  };

  window.charts = charts;
})();
