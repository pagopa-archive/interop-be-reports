// import { env } from '../configs/env.js'
import { Metric, MetricName, TimedMetricKey } from '../models/metrics.model.js'
import { toSnakeCase } from '../utils/helpers.utils.js'

const TODAY_DATE = new Date().toISOString().split('T')[0]

/**
 * skos:Concept
 */
type SkosConcept = {
  about: string
  prefLabel?: string
  lang?: string
}

/**
 * dcatapit:Organization
 */
type Organization = {
  name: string
  code: string
  email?: string
  url?: string
}

// const GITHUB_REPO_URL = `https://github.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO}/tree/main/data`
// const GITHUB_RAW_CONTENT_URL = `https://raw.githubusercontent.com/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO}/main/data`
const GITHUB_REPO_URL = `https://github.com/italia/pdnd-opendata/tree/main/data`
const GITHUB_RAW_CONTENT_URL = `https://raw.githubusercontent.com/italia/pdnd-opendata/main/data`
const CHARTS_PAGE = `https://www.interop.pagopa.it/numeri`

const OPENDATA_RDF_METADATA = {
  TITLE: 'PDND - Interoperabilità',
  DESCRIPTION: 'Dati aperti relativi a PDND - Interoperabilità',
  ISSUED: TODAY_DATE,
  MODIFIED: TODAY_DATE,
} as const

const SKOS_CONCEPT = [
  {
    about: 'string',
    prefLabel: 'string',
    lang: 'string',
  },
] as const satisfies ReadonlyArray<SkosConcept>

const ORGANIZATION = {
  name: 'PCM - Dipartimento per la trasformazione digitale',
  code: 'pcm',
  email: 'pdnd-interop-assistenza-opendata@pagopa.it',
  url: 'https://innovazione.gov.it',
} as const satisfies Organization

/**
 * In the rdf file we count the timed metrics as three different metrics, one for each time period.
 * This type is used to make sure that we are counting all
 */
type MetricFileKey = {
  [TMetricName in MetricName]: Extract<Metric, { name: TMetricName }>['data'] extends Record<TimedMetricKey, unknown>
    ? `${TMetricName}${Capitalize<TimedMetricKey>}`
    : TMetricName
}[MetricName]

type MetricFile = {
  fileKey: MetricFileKey
  filename: string
  title: string
  description: string
  rightsHolderName: string
  rightsHolderCode: string
  publisherName: string
  publisherCode: string
  keywords: ReadonlyArray<string>
  modified: string // yyyy-mm-gg
  issued: string // yyyy-mm-gg
}

const getFilename = (fileKey: MetricFileKey): string => toSnakeCase(fileKey)

const METRICS_FILES = [
  {
    fileKey: 'distribuzioneEServicePerEntiErogatori',
    filename: getFilename('distribuzioneEServicePerEntiErogatori'),
    title: 'PDND - Distribuzione degli e-service per enti erogatori',
    description: 'Numero di e-service pubblicati suddivisi per categorie di enti erogatori',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'eServiceConPiuEntiAbilitatiLastSixMonths',
    filename: getFilename('eServiceConPiuEntiAbilitatiLastSixMonths'),
    title: 'PDND - E-service con più enti abilitati - ultimi 6 mesi',
    description: 'Gli e-service più richiesti, filtrabili per categoria di ente erogatore e di ente fruitore',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'eServiceConPiuEntiAbilitatiLastTwelveMonths',
    filename: getFilename('eServiceConPiuEntiAbilitatiLastTwelveMonths'),
    title: 'PDND - E-service con più enti abilitati - ultimi 12 mesi',
    description: 'Gli e-service più richiesti, filtrabili per categoria di ente erogatore e di ente fruitore',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'eServiceConPiuEntiAbilitatiFromTheBeginning',
    filename: getFilename('eServiceConPiuEntiAbilitatiFromTheBeginning'),
    title: 'PDND - E-service con più enti abilitati - inizio del servizio',
    description: 'Gli e-service più richiesti, filtrabili per categoria di ente erogatore e di ente fruitore',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'totaleEnti',
    filename: getFilename('totaleEnti'),
    title: 'PDND - Totale enti e suddivisione per macro-categorie',
    description:
      'Il totale degli enti e delle categorie in evidenza che hanno aderito a PDND Interoperabilità, con la variazione dal mese precedente',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'eservicePubblicati',
    filename: getFilename('eservicePubblicati'),
    title: 'PDND - E-service pubblicati',
    description: "Numero di e-service pubblicati e variazione nell'ultimo mese",
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'distribuzioneDegliEntiPerAttivita',
    filename: getFilename('distribuzioneDegliEntiPerAttivita'),
    title: 'PDND - Distribuzione degli enti per attività',
    description:
      'Numero di enti aderenti suddiviso in funzione dell’attività che attualmente svolgono sulla piattaforma',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'andamentoDelleAdesioni',
    filename: getFilename('andamentoDelleAdesioni'),
    title: 'PDND - Andamento delle adesioni',
    description: 'Numero progressivo di enti che hanno aderito alla piattaforma nel tempo',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiChePubblicanoPiuEServiceLastSixMonths',
    filename: getFilename('entiChePubblicanoPiuEServiceLastSixMonths'),
    title: 'PDND - Enti che pubblicano più e-service - ultimi 6 mesi',
    description: 'Gli enti erogatori con più e-service pubblicati',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiChePubblicanoPiuEServiceLastTwelveMonths',
    filename: getFilename('entiChePubblicanoPiuEServiceLastTwelveMonths'),
    title: 'PDND - Enti che pubblicano più e-service - ultimi 12 mesi',
    description: 'Gli enti erogatori con più e-service pubblicati',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiChePubblicanoPiuEServiceFromTheBeginning',
    filename: getFilename('entiChePubblicanoPiuEServiceFromTheBeginning'),
    title: 'PDND - Enti che pubblicano più e-service - inizio del servizio',
    description: 'Gli enti erogatori con più e-service pubblicati',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiConPiuConnessioniAbilitateLastSixMonths',
    filename: getFilename('entiConPiuConnessioniAbilitateLastSixMonths'),
    title: 'PDND - Enti con più connessioni abilitate - ultimi 6 mesi',
    description: 'Gli enti erogatori che hanno abilitato più enti fruitori',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiConPiuConnessioniAbilitateLastTwelveMonths',
    filename: getFilename('entiConPiuConnessioniAbilitateLastTwelveMonths'),
    title: 'PDND - Enti con più connessioni abilitate - ultimi 12 mesi',
    description: 'Gli enti erogatori che hanno abilitato più enti fruitori',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'entiConPiuConnessioniAbilitateFromTheBeginning',
    filename: getFilename('entiConPiuConnessioniAbilitateFromTheBeginning'),
    title: 'PDND - Enti con più connessioni abilitate - inizio del servizio',
    description: 'Gli enti erogatori che hanno abilitato più enti fruitori',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'totaleRichiesteDiAccesso',
    filename: getFilename('totaleRichiesteDiAccesso'),
    title: 'Totale sessioni di scambio',
    description: 'Numero totale delle sessioni di scambio, con la variazione del mese precedente',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'attivitaDellaPiattaformaLastSixMonths',
    filename: getFilename('attivitaDellaPiattaformaLastSixMonths'),
    title: 'Attività della piattaforma - ultimi 6 mesi',
    description: 'Numero di sessioni di scambio dati giornaliere',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'attivitaDellaPiattaformaLastTwelveMonths',
    filename: getFilename('attivitaDellaPiattaformaLastTwelveMonths'),
    title: 'Attività della piattaforma - ultimi 12 mesi',
    description: 'Numero di sessioni di scambio dati giornaliere',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
  {
    fileKey: 'attivitaDellaPiattaformaFromTheBeginning',
    filename: getFilename('attivitaDellaPiattaformaFromTheBeginning'),
    title: 'Attività della piattaforma - inizio del servizio',
    description: 'Numero di sessioni di scambio dati giornaliere',
    rightsHolderName: 'PCM - Dipartimento per la trasformazione digitale',
    rightsHolderCode: 'AA1D3A2',
    publisherName: 'PagoPA S.p.A.',
    publisherCode: '5N2TR557',
    keywords: ['PDND', 'API', 'PNRR', 'Interoperabilità'],
    modified: TODAY_DATE,
    issued: TODAY_DATE,
  },
] as const satisfies ReadonlyArray<MetricFile>

export class MetricsOpenDataRdfGenerator {
  public produceOpenDataRDF(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
  <rdf:RDF xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:locn="http://www.w3.org/ns/locn#" xmlns:hydra="http://www.w3.org/ns/hydra/core#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dcat="http://www.w3.org/ns/dcat#" xmlns:dct="http://purl.org/dc/terms/" xmlns:dcatapit="http://dati.gov.it/onto/dcatapit#" xmlns:vcard="http://www.w3.org/2006/vcard/ns#" xmlns:adms="http://www.w3.org/ns/adms#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gsp="http://www.opengis.net/ont/geosparql#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
  ${this.produceRDFCatalog()}
  ${METRICS_FILES.map(this.produceRDFDataset).join('\n')}
  ${METRICS_FILES.map(this.produceRDFDistribution).join('\n')}
  ${SKOS_CONCEPT.map(this.produceRDFConcept).join('\n')}
  ${this.produceRDFOrganization()}
</rdf:RDF>
`
  }

  private produceRDFCatalog(): string {
    return `
<dcatapit:Catalog rdf:about="${GITHUB_REPO_URL}">
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Catalog"/>
  <dct:title>${OPENDATA_RDF_METADATA.TITLE}</dct:title>
  <dct:publisher>
    <dcatapit:Agent rdf:about="${ORGANIZATION.code}">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>${ORGANIZATION.code}</dct:identifier>
      <foaf:name>${OPENDATA_RDF_METADATA.TITLE}</foaf:name>
    </dcatapit:Agent>
  </dct:publisher>
  <dct:description>${OPENDATA_RDF_METADATA.DESCRIPTION}</dct:description>
  <dct:language>it</dct:language>
  <foaf:homepage rdf:resource="${GITHUB_REPO_URL}##"/>
  <dcat:themeTaxonomy>
    <skos:ConceptScheme rdf:about="http://publications.europa.eu/resource/authority/data-theme">
      <dct:title>Data Theme Vocabulary</dct:title>
    </skos:ConceptScheme>
  </dcat:themeTaxonomy>
  <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${OPENDATA_RDF_METADATA.MODIFIED}</dct:modified>
  <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${OPENDATA_RDF_METADATA.ISSUED}</dct:issued>
  <dct:license rdf:resource="https://creativecommons.org/licenses/by/4.0/"/>
  ${METRICS_FILES.map(this.produceRDFCatalogDataset).join('\n')}
</dcatapit:Catalog>
  `
  }

  private produceRDFCatalogDataset({ filename }: MetricFile): string {
    return `<dcat:dataset rdf:resource="${GITHUB_REPO_URL}/${filename}"/>`
  }

  private produceRDFDataset(metricFile: MetricFile): string {
    const {
      filename,
      title,
      description,
      rightsHolderName,
      rightsHolderCode,
      publisherName,
      publisherCode,
      modified,
      issued,
      keywords,
    } = metricFile

    return `
<dcatapit:Dataset rdf:about="${GITHUB_REPO_URL}/${filename}">
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Dataset"/>
  <dcat:theme rdf:resource="http://publications.europa.eu/resource/authority/data-theme/GOVE"/>
  <dct:license/>
  <dct:title>${title}</dct:title>
  <dct:landingpage>${GITHUB_REPO_URL}/${filename}.csv</dct:landingpage>
  <dct:description>${description}</dct:description>
  <dct:identifier>${rightsHolderCode}:${filename}</dct:identifier>
  <dct:accrualPeriodicity rdf:resource="http://publications.europa.eu/resource/authority/frequency/DAILY"/>
  <dcat:contactPoint rdf:resource="${CHARTS_PAGE}"/>
  <dct:rightsHolder>
    <dcatapit:Agent rdf:about="${rightsHolderCode}">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>${rightsHolderCode}</dct:identifier>
      <foaf:name>${rightsHolderName}</foaf:name>
    </dcatapit:Agent>
  </dct:rightsHolder>
  <dct:publisher>
    <dcatapit:Agent rdf:about="${publisherCode}">
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
      <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Agent"/>
      <dct:identifier>${publisherCode}</dct:identifier>
      <foaf:name>${publisherName}</foaf:name>
    </dcatapit:Agent>
  </dct:publisher>
  <dct:subject rdf:resource="http://eurovoc.europa.eu/100210"/>
  <dct:language rdf:resource="http://publications.europa.eu/resource/authority/language/ITA"/>
  <dct:license rdf:resource="https://creativecommons.org/licenses/by/4.0/"/>
  <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${modified}</dct:modified>
  <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${issued}</dct:issued>
  <dcat:contactPoint rdf:resource="${CHARTS_PAGE}"/>
  ${keywords.map((keyword) => `<dcat:keyword>${keyword}</dcat:keyword>`).join('\n')}
  <dcat:distribution rdf:resource="${GITHUB_REPO_URL}/${filename}.csv"/>
  <dcat:distribution rdf:resource="${GITHUB_REPO_URL}/${filename}.json"/>
</dcatapit:Dataset>
    `
  }

  private produceRDFDistribution(metricFile: MetricFile): string {
    const { title, filename } = metricFile

    const csvfileUrl = `${GITHUB_RAW_CONTENT_URL}/${filename}.csv`
    const csvfileJSON = `${GITHUB_RAW_CONTENT_URL}/${filename}.json`

    return `
<dcatapit:Distribution rdf:about="${GITHUB_REPO_URL}/${filename}.csv">
  <dcat:accessURL rdf:resource="${csvfileUrl}"/>
  <dct:license>
    <dcatapit:LicenseDocument rdf:about="https://w3id.org/italia/controlled-vocabulary/licences/A11_CCO10">
      <rdf:type rdf:resource="dct:LicenseDocument"/>
      <dct:type rdf:resource="http://purl.org/adms/licencetype/Attribution"/>
      <foaf:name>Creative Commons CC0 1.0 Universale - Public Domain Dedication (CC0 1.0)</foaf:name>
    </dcatapit:LicenseDocument>
  </dct:license>
  <dct:format rdf:resource="CSV"/>
  <dct:description>File in formato CSV per l'interoperabilità</dct:description>
  <dct:title>${title} CSV</dct:title>
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Distribution"/>
</dcatapit:Distribution>
<dcatapit:Distribution rdf:about="${GITHUB_REPO_URL}/${filename}.json">
  <dcat:accessURL rdf:resource="${csvfileJSON}"/>
  <dct:license>
    <dcatapit:LicenseDocument rdf:about="https://w3id.org/italia/controlled-vocabulary/licences/A11_CCO10">
      <rdf:type rdf:resource="dct:LicenseDocument"/>
      <dct:type rdf:resource="http://purl.org/adms/licencetype/Attribution"/>
      <foaf:name>Creative Commons CC0 1.0 Universale - Public Domain Dedication (CC0 1.0)</foaf:name>
    </dcatapit:LicenseDocument>
  </dct:license>
  <dct:format rdf:resource="JSON"/>
  <dct:description>File in formato JSON per l'interoperabilità</dct:description>
  <dct:title>${title} JSON</dct:title>
  <rdf:type rdf:resource="http://www.w3.org/ns/dcat#Distribution"/>
</dcatapit:Distribution>

`
  }

  private produceRDFConcept({ about, prefLabel, lang }: SkosConcept): string {
    return `
<skos:Concept rdf:about="${about}">
  ${prefLabel && lang ? `<skos:prefLabel xml:lang="${lang}">${prefLabel}</skos:prefLabel>` : ''}${
    prefLabel && !lang ? `<skos:prefLabel>${prefLabel}</skos:prefLabel>` : ''
  }${!prefLabel && lang ? `<skos:prefLabel xml:lang="${lang}"/>` : ''}
</skos:Concept>`
  }

  private produceRDFOrganization(): string {
    const { name, url, email } = ORGANIZATION
    return `
<dcatapit:Organization rdf:about="${url}">
  <rdf:type rdf:resource="vcard:Organization"/>
  <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Organization"/>
  <rdf:type rdf:resource="http://www.w3.org/2006/vcard/ns#Kind"/>
  <rdf:type rdf:resource="http://www.w3.org/2006/vcard/ns#Organization"/>
  <rdf:type rdf:resource="vcard:Kind"/>
  <vcard:fn>${name}</vcard:fn>
  ${email ? `<vcard:hasEmail rdf:resource="${email}"/>` : ''}
  <vcard:hasURL rdf:resource="${url}"/>
</dcatapit:Organization>
`
  }
}
