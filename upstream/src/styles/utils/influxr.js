/**
 * File: influxr.js
 * Same as the influx.js module except imports are changed to work with REACT.
 */

/**
 * extract() - extract the tags, values, and time from a line of Influx Line protocol
 */
const extractFromTags = (payload) => {
//const f = "mqttReact.js::extractInfluxTags"
  const [tagStr,valueStr,time] = payload.split(' ')

  const valueA = valueStr.split(',')
  let values = {}
  for (let t = 0; t < valueA.length; t++) {
    const [name, value] = valueA[t].split('=')
    values[name] = value;
//  console.log(f, "add tag", name, value)
  }

  const tagA = tagStr.split(',')
  let tags = {}
  for (let t = 0; t < tagA.length; t++) {
    const [name, value] = tagA[t].split('=')
    tags[name] = value;
//  console.log(f, "add tag", name, value)
  }

  return {tags, values, time}
}

/**
 * Given a metric name, create the Influx line protocol tags.
 * @param metric
 */
const makeTagsFromMetricId = (metricId, type, projectId) => {
  const flds = metricId.split('_')
  const nf = flds.length
  const units = flds[nf-1]
  const metricId =               ',MetricId=' + metricId
  const metricName =             ',MetricName=' + type + "_" projectId + "_" metricId 
  const type =                   ',Type=' + type : ''
  const component =              ',Component=' + flds[0]
  const device =      (nf > 2) ? ',Device=' + flds[1] : ''
  const position =    (nf > 3) ? ',Position=' + flds[2] : ''
  const composition = (nf > 4) ? ',Composition=' + flds[3] : ''
  return `${units}${metricId}${metricName}${type}${component}${device}${position}${composition}`
}

/**
 * Given a metric name, create the Influx line protocol tags.
 * @param metric
 */
const makeTagsFromMetricName = metricName => {
  const regexp = /^[a-zA-Z0-9]_+?/
  const flds = metricName.split('_')
  const nf = flds.length
  const units = flds[nf-1]
  const metricId =               ',MetricId=' + metricName.replace(regexp,'')
  const metricName =             ',MetricName=' + metricName
  const type =                   ',Type=' + flds[0]
  const projectId =              ',ProjectId=' + flds[1]
  const component =              ',Component=' + flds[2]
  const device =      (nf > 3) ? ',Device=' + flds[3] : ''
  const position =    (nf > 4) ? ',Position=' + flds[4] : ''
  const composition = (nf > 5) ? ',Composition=' + flds[5] : ''
  return `${units}${metric}${metricName}${type}${component}${device}${position}${composition}`
}

// module.exports.makeTagsFromMetricId   = makeTagsFromMetricId
// module.exports.makeTagsFromMetricName = makeTagsFromMetricName
// module.exports.extractFromTags        = extractFromTags

export {
  makeTagsFromMetricId,
  makeTagsFromMetricName,
  extractFromTags,
}
