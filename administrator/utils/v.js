// File: v.js

const {msg} = require("./msg")
const yaml = require('js-yaml')

/*
const fs = require('fs')
const YAML = require('yaml-parser')
const path = require('path')
require('dotenv').config();

const mqttNode  = require('./utils/mqttNode')
const {ckTopic, completeAllTopics, completeTopic}  = require('./utils/topics')
const influx = require("./utils/influx")
const {currentDate} = require("./utils/tools")
const os = require('os')

const seedrandom  = require('seedrandom')
const clientId = "administrator"
const generator = seedrandom(Date.now())
 */


const fm = "v:main - "

var V = {}
const ActionIds = ['inp', 'hum', 'out', 'upper', 'lower', 'high', 'low']
const EdgeIds =   ['inp', 'hum', 'out']
const StatusIds = ['ok', 'upper', 'lower', 'high', 'low']

/**
 * addMetricValues -- Add Metric values to client config
 *
 * @param projectId
 * @param metricId
 * @param actionId
 * @param values
 * @param userId
 */
const addMetricValues = (projectId, metricId, actionId, values, userId) => {
  const f = "administrator::addMetricValues"
  try {
    // Add object to V tree if necessary
    if (!V?.[projectId]?.[metricId]?.[actionId]) {
      if (!(projectId in V)) {
        V[projectId] = {[metricId]: {[actionId]: {}}}
      } else if (!(metricId in V[projectId])) {
        V[projectId][metricId] = {[actionId]: {}}
      } else if (!(actionId in V[projectId][metricId])) {
        V[projectId][metricId][actionId] = {}
      }
    }

    // for each valueId in values array
    for (var valueId in values) {
      // Add a new v object to the tree for each valueId
      // If there is already a valueId - copy new properties - don't touch actionId and stale
      if (valueId in V[projectId][metricId][actionId]) {
        V[projectId][metricId][actionId][valueId].val = values[valueId].val
        V[projectId][metricId][actionId][valueId].date = values[valueId].date
        V[projectId][metricId][actionId][valueId].userId = values[valueId].userId
      } else { // if there is no valueId
        V[projectId][metricId][actionId][valueId] = values[valueId]
        V[projectId][metricId][actionId][valueId].actionId = 'unk'
        V[projectId][metricId][actionId][valueId].stale = 'unk'
      }
    }
  } catch(err) {
    console.error(f, err)
  }
}

/**
 * checkMetricValues - check inp, hum, out against upper, lower, high, low
 *   Set the valueState for each, if changed then send a message
 *
 * @param _projectId
 * @param _metricId
 *
 * Check the status of a metric and publish a message if the status changes
 * Check against high and low first
 * Then check upper alarm and lower alarm
 * If current status is different then
 *   publish a message to the bus
 */
const checkMetricValues = (_projectId, _metricId) => {
  const f = 'administrator::checkMetricValues'

  try {
    var vm = V[_projectId][_metricId];
    for (var s in EdgeIds) {
      const actionId = EdgeIds[s]
      if (vm[actionId]) {
        const val = vm[actionId].value.val
        var newStatus = "ok"
        var setPoint = -999;
        if (vm.high && val > vm.high.value.val) {          // high range
          setPoint = vm.high.value.val
          newStatus = "high"
        } else if (vm.low && val < vm.low.value.val) {     // low range
          setPoint = vm.low.value.val
          newStatus = "low"
        } else if (vm.upper && val > vm.upper.value.val) { // upper alarm
          setPoint = vm.upper.value.val
          newStatus = "upper"
        } else if (vm.lower && val < vm.lower.value.val) { // lower alarm
          setPoint = vm.lower.value.val
          newStatus = "lower"
        }
        if (newStatus !== vm[actionId].value.status) {
          const payload = {
            metricId: _metricId,
            projectId: _projectId,
            initialStatusId: vm[actionId].value.status,
            status: newStatus,
            setPoint: setPoint,
            value: val,
            vm: vm,
          }
          vm[actionId].value.status = newStatus
          var topic = global.aaa.topics.publish.alm
          topic = topic.replace(/DPROJECTID/, _projectId)
          var str = JSON.stringify(payload)
          msg(1, f, msgE.debug, `call mqttNode.publish - topic: ${topic} length:${str.length}`)
          mqttNode.publish(topic, str);
        }
      }
    }
  } catch(err) {
    msg(1, f, msgE.error, _metricId, err);
  }
}

//  output to MQTT all values of a metric
const publishMetricValues = (_projectId, _metricId, _clientId) => {
  // publish values
  // topic PROJECTID/rsp/clientId
  var mv;
  if (mv = V[_projectId][_metricId]) {
    var payload = {}
    if (mv.stale)  { payload['stale'] = mv.stale}
    if (mv.status) { payload['status'] = mv.status}
    if (mv.inp)    { payload['inp'] = mv.value}
    if (mv.hum)    { payload['hum'] = mv.value}
    if (mv.out)    { payload['out'] = mv.value}
    if (mv.high)   { payload['high'] = mv.high}
    if (mv.low)    { payload['low'] = mv.low}
    if (mv.upper)  { payload['upper'] = mv.upper }
    if (mv.lower)  { payload['lower'] = mv.lower }

    var outTopic = `${_projectId}/rsp/${_clientId}`
    var outStr = JSON.stringify(payload)
    msg(1,f, msgE.debug,`call mqttNode.publish - topic: ${outTopic} length:${outStr.length}`)
    mqttNode.publish(outTopic, outStr);
  } else {
    msg(0,f, msgE.warning,`metric not found ${_projectId} ${_metricId}`)
  }
}

/**
 * getMetricV - get the V array for a process, metric, action or value
 *
 * @param projectId
 * @param metricId
 * @param actionId
 * @param valueId
 * @returns {{}|null|*}
 */
const getMetricV = (_projectId, _metricId, _actionId, _valueId) => {
  const f = 'administrator::getMetricV'
  var vp, vm, vs, vv;
  const projectId = (_projectId) ? _projectId.toLowerCase() : null
  const metricId  = (_metricId)  ? _metricId.toLowerCase()  : null
  const actionId  = (_actionId)  ? _actionId.toLowerCase()  : null
  const valueId   = (_valueId)   ? _valueId.toLowerCase()   : null
  if (projectId) {
    if (!(vp = V[projectId])) {
      msg(1,f, msgE.error,"Not found - Cannot find projectId - ", projectId)
      return null;
    }
    if (metricId) {
      if (!(vm = V[projectId][metricId])) {
        msg(1,f, msgE.error,"Not found - Cannot find metricId - ", projectId + ' ' + metricId)
        return null;
      }
      if (actionId) {
        if (!(vs = V[projectId][metricId][actionId])) {
          msg(1,f, msgE.error,"Not found - Cannot find actionId - ", projectId+ ' ' + metricId + ' ' + actionId)
          return null;
        }
        if (valueId) {
          if (!(vv = V[projectId][metricId][actionId][valueId])) {
            msg(1,f, msgE.error,"Not found - Cannot find valueId- ", projectId+ ' ' + metricId + ' ' + actionId + ' ' + valueId)
            return null;
          }
          vs.type = 'value'
          return vv
        } else {
          vs.type = 'action'
          return vs
        }
      } else {
        vm.type = 'metric'
        return vm
      }
    } else {
      vp.type = 'project'
      return vp
    }
  } else {
    V.type = 'V'
    return V
  }
}


/**
 * setDefaults
 * @param metric
 *
 * Set the defaults for inp, hum, out, upper, lower, high, low
 *   if possible get the V[projectId, metridId record set to v
 */
const setDefaults = (_metric) => {
  const f = "administrator::setDefaults"
  const projectId = _metric.projectId
  const metricId = _metric.metricId
  // Get V for this metric first - there is only one
  try {
    var vm = getMetricV(projectId, metricId)
    vm = (vm && vm.type === "metric") ? vm : undefined
    if (!_metric.v) _metric.v = {}

    for (var a in ActionIds) {
      const actionId = ActionIds[a]
      if (!_metric[actionId]) continue    // skip unconfigured actions
      var v
      var vms
      if (vm && vm[actionId]) {                 // if there is a current value
        _metric.v[actionId] = vm[actionId]
      } else if ('default' in _metric[actionId]) {  // if there is a default valu
        vms = {
          value: {
            val: _metric[actionId].default,
            date: Date.now(),
            userId: 'unk',  // should be default
            status: 'unk',
            stale: 'unk',
          }
        }
        _metric.v[actionId] = vms
        addMetricValues(projectId,metricId,actionId,vms, 'default')
      } else {          // no V && no default
        vms = {
          value: {
            val: -999,
            date: Date.now(),
            userId: 'unk',
            status: 'unk',
            stale: 'unk',
          }
        }
        _metric.v[actionId] = vms
        addMetricValues(projectId,metricId,actionId,vms, 'unspecified')
      }
    }
  } catch(err) {
    msg(0,f,msgE.error,err);
  }
}
const haveValue = (_projectId,_metricId,_actionId,_valueId) => {
  return V?.[_projectId]?.[_metricId]?.[_actionId]?.[_valueId]
}

module.exports = {
  addMetricValues,
  checkMetricValues,
  publishMetricValues,
//processMqttInput,
  getMetricV,
  setDefaults,
  haveValue,
}
