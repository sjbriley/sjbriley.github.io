(function() {

    let currentIndex = 0;

    function updateNav() {
        d3.select('#prevScene').attr('disabled', currentIndex === 0 ? true : null);
        d3.select('#nextScene').attr('disabled', currentIndex === 3 ? true : null);
    }

    function addPopup(svg, xPx, yPx, {dx=30, dy=-30, title='', label=''} = {}) {
        const root = (svg && typeof svg.node === 'function') ? svg : d3.select(svg);
        const svgW = +root.attr('width') || root.node().getBoundingClientRect().width || 0;
        const svgH = +root.attr('height') || root.node().getBoundingClientRect().height || 0;

        const g = root.append('g')
                      .attr('class','popup')
                      .attr('pointer-events','none');

        const note = g.append('g');

        const titleEl = note.append('text')
            .attr('class','title')
            .attr('font-weight','600')
            .text(title);

        const labelEl = note.append('text')
            .attr('class','label')
            .attr('y',16)
            .text(label);

        const pad = 6;
        const tb = titleEl.node().getBBox();
        const lb = labelEl.node().getBBox();
        const bubbleW = Math.max(tb.width, lb.width) + pad * 2;
        const bubbleH = tb.height + lb.y + lb.height + pad * 2;

        let noteX = xPx + dx;
        let noteY = yPx + dy;

        let left = noteX - pad;
        let top  = noteY - tb.height - pad;

        const maxLeft = Math.max(0, svgW - bubbleW);
        const maxTop  = Math.max(0, svgH - bubbleH);
        if (left < 0) left = 0;
        if (top < 0) top = 0;
        if (left > maxLeft) left = maxLeft;
        if (top > maxTop) top = maxTop;

        const adjNoteX = left + pad;
        const adjNoteY = top + tb.height + pad;

        const adjDx = adjNoteX - xPx;
        const adjDy = adjNoteY - yPx;

        note.attr('transform',`translate(${adjNoteX},${adjNoteY})`);

        note.insert('rect',':first-child')
            .attr('class','bg')
            .attr('x', -pad)
            .attr('y', -tb.height - pad)
            .attr('width', bubbleW)
            .attr('height', bubbleH)
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill','#fff')
            .attr('stroke','#999');

        g.append('line')
            .attr('class','leader')
            .attr('x1',xPx)
            .attr('y1',yPx)
            .attr('x2',xPx+adjDx)
            .attr('y2',yPx+adjDy)
            .attr('stroke','#555')
            .attr('stroke-dasharray','3,3');

        g.raise();
    }

    function showScene(idx) {
        currentIndex = idx;
        updateNav();
        switch (currentIndex) {
            case 0:
                renderScene(0);
                break;
            case 1:
                renderScene(1);
                break;
            case 2:
                renderScene(2);
                break;
            case 3:
                renderScene4();
                break;
        }
    }

    function renderScene(scene) {
        let year1, year2, prevYear1, prevYear2
        switch (scene) {
            case 0:
                year1 = 1992
                year2 = 1999
                break;
            case 1:
                year1 = 2000
                year2 = 2007
                prevYear1 = 1992
                prevYear2 = 1999
                break;
            case 2:
                year1 = 2008
                year2 = 2015
                prevYear1 = 2000
                prevYear2 = 2007
                break;
        }
        const containerSel = '#scene-container';
        const sceneEl = d3.select(containerSel);
        sceneEl.html('');

        const { nationalYear, causeYear } = window.data;
        const period = nationalYear.filter(d => d.year >= year1 && d.year <= year2);
        const totalFires = d3.sum(period, d => d.fires);
        const totalAcres = d3.sum(period, d => d.acres);

        const avgFires = totalFires / period.length;
        const maxFires = d3.max(period, d => d.fires);
        const maxYearRow = period.find(d => d.fires === maxFires);

        const lineDiv = sceneEl.append('div').attr('class', 'chart-line');
        const barDiv = sceneEl.append('div').attr('class', 'chart-bar');
        const { svg, x, y, margin } = charts.lineChart(lineDiv.node(), period, {
            xKey: 'year',
            yKey: 'fires',
            xLabel: 'Year',
            yLabel: 'Number of Fires',
            color: '#2a9d8f',
            width: 800,
            height: 300
        });
        addPopup(svg,
            margin.left + x(maxYearRow.year),
            margin.top + y(maxYearRow.fires),
            {
                dx: 30,
                dy: -30,
                title: 'Peak year',
                label: `${maxYearRow.year} - ${maxYearRow.fires.toLocaleString()} fires`
            }
        );
        svg.selectAll('.annotation,.popup').raise();

        const causeSubset = causeYear.filter(d => d.year >= year1 && d.year <= year2);
        const causeAgg = d3.rollup(causeSubset, v => d3.sum(v, d => d.fires), d => d.cause);
        const causeData = Array.from(causeAgg, ([cause, fires]) => ({cause, fires}))
            .sort((a, b) => d3.descending(a.fires, b.fires));

        charts.barChart(barDiv.node(), causeData, {
            xKey: 'cause',
            yKey: 'fires',
            xLabel: 'Cause of Fire',
            yLabel: 'Number of Fires',
            color: '#f4a261',
            width: 800,
            height: 300
        });

        if (scene !== 0){
            prevPeriod = nationalYear.filter(d => d.year >= prevYear1 && d.year <= prevYear2);
            prevAvg = d3.sum(prevPeriod, d => d.fires) / prevPeriod.length;
            change = ((avgFires - prevAvg) / prevAvg) * 100;
            d3.select('#subtitle').text(
                `${year1}-${year2}: ${totalFires.toLocaleString()} fires burned ${totalAcres.toLocaleString()} acres. ` +
                `Average annual fires were ${Math.round(avgFires).toLocaleString()}, ` +
                `${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% relative to ${prevYear1}-${prevYear2}.`
            );
        }
        else {
            d3.select('#subtitle').text(
                `${year1}-${year2}: ${totalFires.toLocaleString()} recorded fires burned ${totalAcres.toLocaleString()} acres. ` +
                `The average was ${Math.round(avgFires).toLocaleString()} fires per year.`
            );
        }
        d3.select('#controls').classed('hidden', true);
    }

    function renderScene4() {
        const containerSel = '#scene-container';
        const sceneEl = d3.select(containerSel);
        sceneEl.html('');

        const { nationalYear, stateYear, causeYear, stateCauseYear } = window.data;

        d3.select('#controls').classed('hidden', false);

        const lineDiv = sceneEl.append('div').attr('id', 'explore-line');
        const mapDiv = sceneEl.append('div').attr('id', 'explore-map');
        const barDiv = sceneEl.append('div').attr('id', 'explore-bar');

        if (d3.select('#stateSelect option').size() <= 1) {
            const states = Array.from(new Set(stateYear.map(d => d.state))).sort();
            const stateSelect = d3.select('#stateSelect');
            states.forEach(s => {
                stateSelect.append('option').attr('value', s).text(s);
            });

            const causes = Array.from(new Set(causeYear.map(d => d.cause))).sort();
            const causeSelect = d3.select('#causeSelect');
            causes.forEach(c => {
                causeSelect.append('option').attr('value', c).text(c);
            });
        }

        function update() {
            const stateVal = d3.select('#stateSelect').property('value');
            const causeVal = d3.select('#causeSelect').property('value');
            let yearStart = +d3.select('#yearStart').property('value');
            let yearEnd   = +d3.select('#yearEnd').property('value');

            if (yearStart > yearEnd) {
                const tmp = yearStart; yearStart = yearEnd; yearEnd = tmp;
                d3.select('#yearStart').property('value', yearStart);
                d3.select('#yearEnd').property('value', yearEnd);
            }
            d3.select('#yearLabel').text(`${yearStart}-${yearEnd}`);

            let base;
            if (stateVal !== 'all' && causeVal !== 'all') {
                base = stateCauseYear.filter(d => d.state === stateVal && d.cause === causeVal);
            } else if (stateVal !== 'all') {
                base = stateYear.filter(d => d.state === stateVal);
            } else if (causeVal !== 'all') {
                base = causeYear.filter(d => d.cause === causeVal);
            } else {
                base = nationalYear;
            }
            const filtered = base.filter(d => d.year >= yearStart && d.year <= yearEnd);
            const roll = d3.rollup(filtered, v => d3.sum(v, d => d.fires), d => d.year);
            const lineData = Array.from(roll, ([year, fires]) => ({year, fires}))
                .sort((a, b) => d3.ascending(a.year, b.year));
            const { svg, x, y, margin } = charts.lineChart(lineDiv.node(), lineData, {
                xKey: 'year', yKey: 'fires', xLabel: 'Year', yLabel: 'Number of Fires',
                color: '#264653', width: 800, height: 300
            });
            if (lineData.length) {
                const maxFires = d3.max(filtered, d => d.fires);
                const peak = filtered.find(d => d.fires === maxFires);
                addPopup(svg,
                    margin.left + x(peak.year),
                    margin.top + y(peak.fires),
                    {
                        dx: 30,
                        dy: -30,
                        title: 'Peak year',
                        label: `${peak.year} - ${peak.fires.toLocaleString()} fires`
                    }
                );
            }

            let mapBase = stateYear;
            if (causeVal !== 'all') {
                mapBase = stateCauseYear.filter(d => d.cause === causeVal);
            }
            let mapFiltered = mapBase.filter(d => d.year >= yearStart && d.year <= yearEnd);
            if (stateVal !== 'all') {
                mapFiltered = mapFiltered.filter(d => d.state === stateVal);
            }
            const stateAgg = d3.rollup(mapFiltered, v => d3.sum(v, d => d.fires), d => d.state);
            const stateDict = {};
            stateAgg.forEach((fires, s) => { stateDict[s] = fires; });
            stateMap.draw(mapDiv.node(), stateDict, { width: 600, height: 400 });

            let causeBaseForBars = (stateVal !== 'all')
                ? stateCauseYear.filter(d => d.state === stateVal)
                : causeYear;
            const causeFiltered = causeBaseForBars.filter(d => d.year >= yearStart && d.year <= yearEnd);
            const causeAggMap = d3.rollup(causeFiltered, v => d3.sum(v, d => d.fires), d => d.cause);
            let causeData = Array.from(causeAggMap, ([cause, fires]) => ({ cause, fires }))
                .sort((a, b) => d3.descending(a.fires, b.fires));
            if (causeVal !== 'all') {
                causeData = causeData.filter(d => d.cause === causeVal);
            }
            const { svg: barSvg } = charts.barChart(barDiv.node(), causeData, {
                xKey: 'cause', yKey: 'fires', xLabel: 'Cause of Fire', yLabel: 'Number of Fires',
                color: '#2a9d8f', width: 800, height: 300
            });
            if (causeData.length) {
                const top = causeData[0];
                addPopup(barSvg, 70, 20, {
                dx: 10, dy: 0,
                title: (stateVal !== 'all' ? 'Top cause (state)' : 'Top cause'),
                label: `${top.cause} (${top.fires.toLocaleString()})`
                });
            }
            }

        d3.select('#stateSelect').on('change', update);
        d3.select('#causeSelect').on('change', update);
        d3.select('#yearStart').on('input', update);
        d3.select('#yearEnd').on('input', update);

        d3.select('#yearLabel').text(`${d3.select('#yearStart').property('value')}-${d3.select('#yearEnd').property('value')}`);

        update();
        d3.select('#subtitle').text('Explore the data: filter by state, cause and end year to see how fire patterns vary.');
    }

    window.scenes = {
        show: showScene,
        next: () => showScene(currentIndex + 1),
        prev: () => showScene(currentIndex - 1)
    };
})();
