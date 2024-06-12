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
//projectId = projectId.toLowerCase()

  const [metrics, setMetrics] = useState({})
  const [options, setOptions] = useState({})
  const [chartData, setChartData] = useState({})

  const metricCB = useCallback((metric, actionId, topic, payload, tags, values) => {
//  const f = "LineChartPanel::metricCB"
//  console.log(f,"enter ", topic)
//  if (actionId !== tags.ActionId) return
    setChartData((prevChartData) => {
//    const isMetric = (element) => {
//      return (element === metric.metricId)
//    }

      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      val = parseFloat(val).toFixed(metric.decimals)

      const updatedDatasets = [...prevChartData.datasets]
      var date = new Date();
      const dateStr = date.toLocaleString()

      // Update the specific dataset with date and val
      updatedDatasets[metric[actionId].index] = {
        ...updatedDatasets[metric[actionId].index],
        data: [...updatedDatasets[metric[actionId].index].data, {x: dateStr, y: val}],
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
  }, [])

  useEffect(() => {
    // Get options from configuration
    if (props.options === undefined ) return
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
      var cmetric = options.cmetrics[m]
      const metricId = cmetric.metricId.toLowerCase()
      const actionId = cmetric.actionId
      cmetric.metricId = metricId // ?? why do this? shouldn't it be there already?
      const projectId = cmetric.projectId || props.options.projectId || global.aaa.projectId
      var metric = findMetric(projectId, metricId)
      if (actionId === 'hum') {
        metric.hum.index = m
      } else {
        metric[actionId].index = m
      }
      cmetric.metric = metric
      console.log(`James - ${actionId}`)


      mqttRegisterMetricCB(projectId, actionId, metricId, metricCB)
      var label;
      var color;
      if (cmetric.labelSrc && cmetric.labelSrc === 'action') {
        label = global.aaa.actionIds[actionId].name;
        color = global.aaa.actionIds[actionId].color
      } else {
        label = metric.label || metric.name;
        color = metric.color
      }
      chartData.datasets.push({
        label: label,
        actionId: actionId,
        data: [],
        borderColor: color,
        backgroundColor: color,
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