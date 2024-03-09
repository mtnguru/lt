// metrics.js -
//require("./msgE");
//const {msg} = require("./msg");



const findMetric = (_projectId, _metricId) => {
  const f = "metrics::findMetric"
  try {
    const metricId = _metricId.toLowerCase()
    if (global.aaa.metrics?.[_projectId]?.[metricId]) {
      const metric = global.aaa.metrics?.[_projectId]?.[metricId]
      metric.metricId = metricId
      return metric
    }
    console.error(f + '::findMetric - WARNING - could not find metric ' + metricId)
    return null
  } catch(err) {
    console.error('ERROR in metrics::findMetric', err)
    const terr = new Error();
    console.error('   LineNumber', terr.lineNumber)
//  msg(0, f, ERROR, `Cannot find metric ${metricId}`);
  }
  return null;
}

const getValue = (metric,actionId) => {
  if (metric.inp && metric.inp.value) return metric.inp.value
  if (metric.out && metric.out.value) return metric.out.value
  if (metric.hum && metric.hum.value) return metric.hum.value
  return "MV"
}

const c2f = c => { return c * 1.8 + 32 }
const f2c = f => { return (f - 32) / 1.8 }

module.exports.findMetric = findMetric
module.exports.getValue = getValue
module.exports.c2f = c2f
module.exports.f2c = f2c