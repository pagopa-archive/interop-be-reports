import ExcelJs from 'exceljs'
import { headerStyle, rowStyle } from '../configs/excel.config.js'

export class ExcelGenerator {
  private workbook = new ExcelJs.Workbook()

  public addWorksheetTable({ name, data }: { name: string; data: Record<string, string>[] }): ExcelGenerator {
    const worksheet = this.workbook.addWorksheet(name)

    const header: string[] = Object.keys(data[0])
    const values: string[][] = data.map(Object.values)

    worksheet.addRow(header).eachCell((cell) => {
      cell.style = headerStyle
    })
    values.forEach((row) => {
      worksheet.addRow(row).eachCell((cell) => {
        cell.style = rowStyle
      })
    })

    this.adjustColumnWidths(worksheet)

    return this
  }

  public async generateExcelFile(): Promise<Buffer> {
    return (await this.workbook.xlsx.writeBuffer({
      zip: { compression: 'DEFLATE', compressionOptions: { level: 9 } },
    })) as Buffer
  }

  private adjustColumnWidths(worksheet: ExcelJs.Worksheet): void {
    const PADDING = 2
    const MIN_CELL_WIDTH = 10

    worksheet.columns.forEach((column) => {
      let maxColumnLength = 0
      column?.eachCell?.({ includeEmpty: true }, (cell) => {
        maxColumnLength = Math.max(maxColumnLength, MIN_CELL_WIDTH, cell.value ? cell.value.toString().length : 0)
      })
      column.width = maxColumnLength + PADDING
    })
  }
}
