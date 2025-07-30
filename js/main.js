(function() {

  async function loadCsv(url) {
    try {
      const data = await d3.csv(url, d3.autoType);
      return data;
    } catch (err) {
      console.warn(`Failed to load ${url}:`, err);
      return null;
    }
  }

  async function loadData() {
    const nationalYear = await loadCsv('data/national_year.csv');
    const stateYear = await loadCsv('data/state_year.csv');
    const causeYear = await loadCsv('data/cause_year.csv');
    const stateCauseYear = await loadCsv('data/state_cause_year.csv');
    return { nationalYear, stateYear, causeYear, stateCauseYear };
  }

  async function init() {
    window.data = await loadData();
    d3.select('#nextScene').on('click', window.scenes.next);
    d3.select('#prevScene').on('click', window.scenes.prev);
    window.scenes.show(0);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
