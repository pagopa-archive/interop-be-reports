import { GetMetricData, MetricName, Metric, TimedMetricKey } from '../models/metrics.model.js'
import { json2csv, toSnakeCase } from '../utils/helpers.utils.js'

type MetricsDashboardData = { [TMetricName in MetricName]: GetMetricData<TMetricName> }
type MetricFile = { filename: string; data: string }

/**
 * This service is responsible for formatting the metrics data into the format
 * expected by DtD and the metrics frontend dashboard.
 */
export class MetricsOutputFormatterService {
  constructor(private readonly metrics: Array<Metric>) {}

  /**
   * The metrics dashboard expects the data as an object with the metric name as key
   * and the metric data as value.
   */
  public getMetricsDashboardData(): MetricsDashboardData {
    return this.metrics.reduce((acc, metric) => ({ ...acc, [metric.name]: metric.data }), {} as MetricsDashboardData)
  }

  /**
   * The DtD expects the data as an array of files, each file having a filename
   * and the data as a string.
   */
  public getDtdMetricsFiles(): Array<MetricFile> {
    return this.metrics.reduce<Array<MetricFile>>(
      (acc, metric) => [...acc, ...this.getMetricJsonFiles(metric), ...this.getMetricCSVFiles(metric)],
      []
    )
  }

  /**
   * Get the JSON files data for a given metric.
   * If the metric is "timed", i.e. it has data for the last 6 and 12 months and from the beginning,
   * we return 3 files, one for each time period.
   */
  private getMetricJsonFiles(metric: Metric): Array<MetricFile> {
    switch (metric.name) {
      case 'eservicePubblicati':
      case 'distribuzioneEServicePerEntiErogatori':
      case 'totaleEnti':
      case 'distribuzioneDegliEntiPerAttivita':
      case 'totaleRichiesteDiAccesso':
      case 'connessioniTotali':
      case 'andamentoDelleAdesioni':
        return [{ filename: this.getFilename(metric.name, 'json'), data: JSON.stringify(metric.data) }]
      case 'eServiceConPiuEntiAbilitati':
      case 'entiConPiuConnessioniAbilitate':
      case 'entiChePubblicanoPiuEService':
      case 'andamentoDelleAdesioniPerCategoria':
      case 'attivitaDellaPiattaforma':
      case 'eServicePiuUtilizzati':
      case 'eserviceConPiuTokenStaccati':
        return [
          {
            filename: this.getFilename(metric.name, 'json', 'fromTheBeginning'),
            data: JSON.stringify(metric.data.fromTheBeginning),
          },
          {
            filename: this.getFilename(metric.name, 'json', 'lastSixMonths'),
            data: JSON.stringify(metric.data.lastSixMonths),
          },
          {
            filename: this.getFilename(metric.name, 'json', 'lastTwelveMonths'),
            data: JSON.stringify(metric.data.lastTwelveMonths),
          },
        ]
    }
  }

  /**
   * Get the CSV files data for a given metric.
   * If the metric is "timed", i.e. it has data for the last 6 and 12 months and from the beginning,
   * we return 3 files, one for each time period.
   */
  private getMetricCSVFiles(metric: Metric): Array<MetricFile> {
    switch (metric.name) {
      case 'eservicePubblicati':
      case 'totaleRichiesteDiAccesso':
      case 'connessioniTotali':
        return [{ filename: this.getFilename(metric.name, 'csv'), data: json2csv([metric.data]) }]
      case 'totaleEnti':
      case 'distribuzioneDegliEntiPerAttivita':
      case 'distribuzioneEServicePerEntiErogatori':
      case 'andamentoDelleAdesioni':
        return [{ filename: this.getFilename(metric.name, 'csv'), data: json2csv(metric.data) }]
      case 'eServiceConPiuEntiAbilitati':
      case 'entiConPiuConnessioniAbilitate':
      case 'entiChePubblicanoPiuEService':
      case 'andamentoDelleAdesioniPerCategoria':
      case 'attivitaDellaPiattaforma':
      case 'eServicePiuUtilizzati':
      case 'eserviceConPiuTokenStaccati':
        return [
          {
            filename: this.getFilename(metric.name, 'csv', 'fromTheBeginning'),
            data: json2csv(metric.data.fromTheBeginning),
          },
          {
            filename: this.getFilename(metric.name, 'csv', 'lastSixMonths'),
            data: json2csv(metric.data.lastSixMonths),
          },
          {
            filename: this.getFilename(metric.name, 'csv', 'lastTwelveMonths'),
            data: json2csv(metric.data.lastTwelveMonths),
          },
        ]
    }
  }

  private getFilename(metric: MetricName, format: 'csv' | 'json', suffix?: TimedMetricKey): string {
    return `${toSnakeCase(metric)}${suffix ? `_${toSnakeCase(suffix)}` : ''}.${format}`
  }
}
