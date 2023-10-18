// metrics.js -
//require("./msgE");
//const {msg} = require("./msg");

const findMetric = (metricId) => {
//const f = "metrics::findMetric"
  try {
    let metric = global.aaa.metrics[metricId.toLowerCase()]
    if (metric)  {
      return metric;
    }
  } catch(err) {
    console.log('ERROR in metrics::findMetric', err)
//    msg(0, f, ERROR, `Cannot find metric ${metricId}`);
  }
  return null;
}

const getValue = (metric) => {
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
