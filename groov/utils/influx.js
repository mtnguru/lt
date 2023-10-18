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
  }

  const tagA = tagStr.split(',')
  let tags = {}
  for (let t = 0; t < tagA.length; t++) {
    const [name, value] = tagA[t].split('=')
    tags[name] = value;
  }

  return {tags, values, time}
}

/**
 * Given a metric name, create the Influx line protocol tags.
 * @param metric
 */
const makeTagsFromMetricId = (_metricId, _funcId, _projectId) => {
  const flds = _metricId.split('_')
  const nf = flds.length
  const units = flds[nf-1]
  const metricId =               ',MetricId=' + _metricId
  const projectId =              ',ProjectId=' + _projectId
  const funcId =                 ',FuncId=' + _funcId
  const component =              ',Component=' + flds[0]
  const position =    (nf > 2) ? ',Position=' + flds[1] : ''
  const device =      (nf > 3) ? ',Device=' + flds[2] : ''
  const composition = (nf > 4) ? ',Composition=' + flds[3] : ''
  const tags = `${units}${metricId}${funcId}${projectId}${component}${device}${position}${composition}`
  return tags
}

module.exports.makeTagsFromMetricId   = makeTagsFromMetricId
//module.exports.makeTagsFromMetricName = makeTagsFromMetricName
module.exports.extractFromTags      = extractFromTags