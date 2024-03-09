// File: LineChartPanel.js
import React, {useCallback, useState, useEffect} from 'react';

/*
import {
  Text,
  Container,
  Flex,
} from '@chakra-ui/react'
*/

import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f, findMetric} from '../../utils/metrics'

import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

//import { Doughnut } from "react-chartjs-2";
import { Line } from 'react-chartjs-2';

import 'chartjs-adapter-moment';
import 'chartjs-plugin-streaming';

import './LineChartPanel.scss'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const LineChartPanel = (props) => {
  var { actionId } = props
//projectId = projectId.toLowerCase()

  const [metrics, setMetrics] = useState({})
  const [options, setOptions] = useState({})
  const [chartData, setChartData] = useState({})

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
//  const f = "LineChartPanel::metricCB"
//  console.log(f,"enter ", topic)
//  if (actionId !== tags.ActionId) return
    setChartData((prevChartData) => {
      const isMetric = (element) => {
        return (element === metric.metricId)
      }

      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      val = parseFloat(val).toFixed(metric.decimals)

      const updatedDatasets = [...prevChartData.datasets]
      var date = new Date();
      const dateStr = date.toLocaleString()

      // Update the specific dataset with date and val
      updatedDatasets[metric.index] = {
        ...updatedDatasets[metric.index],
        data: [...updatedDatasets[metric.index].data, {x: dateStr, y: val}],
      };

      // Update actionId and return new actionId object
      return {
        ...prevChartData,
        datasets: updatedDatasets,
      };
    });

//  if (props.metricCB) {
//    props.metricCB(metric, topic, payload, tags, values)
//  }
  }, [props, actionId])

  useEffect(() => {
    // Get options from configuration
    if (props.options == undefined ) return
    const options = props.options

//  const now = Date.now();
//  const dnow = new Date(now)
//  const bnow = new Date(now - 60000)
//  options.scales.x.max = dnow.toLocaleString()
//  options.scales.x.min = bnow.toLocaleString()
    setOptions(options)

    // Get metrics, set datasets, register metricCB
    var chartData = {
      labels: [],
      datasets: [],
    }
    for (var m = 0; m < options.cmetrics.length; m++) {
      const cmetric = options.cmetrics[m]
      const metricId = cmetric.metricId.toLowerCase()
      cmetric.metricId = metricId // ?? why do this? shouldn't it be there already?
      const projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
      const metric = findMetric(projectId, metricId)
      cmetric.metric = metric
      metric.index = m
//    if (!metrics[projectId]) {
//      metrics[projectId] = {}
//    }
//    metrics[projectId][metricId] = { ...metric, ...options.cmetrics[m] }

      mqttRegisterMetricCB(projectId, metricId, metricCB)
      chartData.datasets.push({
        label: metric.label || metric.name,
        data: [],
        borderColor: metric.color,
        backgroundColor: metric.color,
        yAxisID: 'yleft',
      })
    }
    setMetrics(metrics)
    setChartData(chartData)
  }, [props.options, metricCB])

  return (
    <div className="line-chart" >
      {Object.keys(options).length ? (
        <Line options={options} data={chartData} />
      ) :
        <p className="loading">Haven't set options yet......</p>
      }
    </div>
  )
}

export default LineChartPanel