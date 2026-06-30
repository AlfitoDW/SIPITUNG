<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PreparePermohonanDanaTemplate extends Command
{
    protected $signature = 'template:prepare-permohonan-dana';

    protected $description = 'Extract 2 sheets from IPTI template and clean sample data';

    public function handle()
    {
        $sourceFile = storage_path('app/templates/permohonan_dana_ipti_original.xlsx');
        $targetFile = storage_path('app/templates/permohonan_dana_template.xlsx');

        if (! file_exists($sourceFile)) {
            $this->error("Source file not found: {$sourceFile}");
            $this->info('Copy the IPTI Excel file to: storage/app/templates/permohonan_dana_ipti_original.xlsx');

            return 1;
        }

        $this->info('Loading IPTI template...');
        $spreadsheet = IOFactory::load($sourceFile);

        $newWorkbook = new Spreadsheet;
        $newWorkbook->removeSheetByIndex(0);

        // Sheet 1: Permohonan Dana (index 2 in original)
        $this->info('Copying sheet: Permohonan Dana...');
        $sheet1 = $spreadsheet->getSheet(2);
        $newSheet1 = $newWorkbook->addExternalSheet($sheet1, 0);
        $newSheet1->setTitle('PERMOHONAN DANA');

        // Sheet 2: Rincian Biaya (index 3 in original)
        $this->info('Copying sheet: Rincian Biaya...');
        $sheet2 = $spreadsheet->getSheet(3);
        $newSheet2 = $newWorkbook->addExternalSheet($sheet2, 1);
        $newSheet2->setTitle('RINCIAN ANGGARAN BIAYA');

        // Clean sample data from Sheet 2 (rows 4+)
        $this->info('Cleaning sample data from Rincian Anggaran Biaya...');
        $this->cleanSheetTwo($newSheet2);

        $this->info("Saving to: {$targetFile}");
        $writer = new Xlsx($newWorkbook);
        $writer->save($targetFile);

        $this->info('Template prepared successfully!');

        return 0;
    }

    private function cleanSheetTwo($sheet): void
    {
        $mergeCells = $sheet->getMergeCells();
        foreach ($mergeCells as $range => $_) {
            [$start, $end] = explode(':', $range);
            $startRow = (int) filter_var($start, FILTER_SANITIZE_NUMBER_INT);
            if ($startRow >= 4) {
                $sheet->unmergeCells($range);
            }
        }

        $lastRow = $sheet->getHighestDataRow();
        for ($row = 4; $row <= $lastRow; $row++) {
            for ($col = 'A'; $col <= 'M'; $col++) {
                $sheet->setCellValue("{$col}{$row}", '');
                $sheet->getStyle("{$col}{$row}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['style' => Border::BORDER_NONE],
                    ],
                ]);
            }
        }
    }
}
