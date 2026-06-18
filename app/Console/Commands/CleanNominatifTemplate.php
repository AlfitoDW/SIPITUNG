<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CleanNominatifTemplate extends Command
{
    protected $signature = 'template:clean-nominatif';

    protected $description = 'Clean nominatif template: keep only 7 sheets, remove external references';

    public function handle()
    {
        $src = base_path('bahan_keuangan/Ref. - User, Pegawai  dan Daftar Nominatif.xlsx');
        $dst = storage_path('app/templates/nominatif_template_clean.xlsx');

        if (! file_exists($src)) {
            $this->error('Source template not found: '.$src);

            return 1;
        }

        $this->info('Loading template...');
        $spreadsheet = IOFactory::load($src);

        // Keep only needed sheets
        $keep = ['521115', '521213', '522151', '524111', '524113', '524114', '524119'];
        $names = $spreadsheet->getSheetNames();

        foreach ($names as $name) {
            if (! in_array($name, $keep)) {
                $idx = $spreadsheet->getIndex($spreadsheet->getSheetByName($name));
                $spreadsheet->removeSheetByIndex($idx);
            }
        }

        $this->info('Saving cleaned template...');
        $writer = new Xlsx($spreadsheet);
        $writer->save($dst);

        // Clean up ZIP: remove external links, calcChain
        $zip = new \ZipArchive;
        if ($zip->open($dst) === true) {
            // Remove external link files
            for ($i = $zip->numFiles - 1; $i >= 0; $i--) {
                $name = $zip->getNameIndex($i);
                if (strpos($name, 'xl/externalLinks/') === 0 || strpos($name, 'xl/calcChain.xml') !== false) {
                    $zip->deleteIndex($i);
                }
            }

            // Remove external link references from workbook rels
            $relsPath = 'xl/_rels/workbook.xml.rels';
            if ($zip->locateName($relsPath) !== false) {
                $content = $zip->getFromName($relsPath);
                $content = preg_replace('/<Relationship[^>]*externalLink[^>]*\/?>/', '', $content);
                $zip->deleteName($relsPath);
                $zip->addFromString($relsPath, $content);
            }

            // Remove external link references from [Content_Types].xml
            $ctPath = '[Content_Types].xml';
            if ($zip->locateName($ctPath) !== false) {
                $content = $zip->getFromName($ctPath);
                $content = preg_replace('/<Override[^>]*externalLink[^>]*\/>/', '', $content);
                $content = preg_replace('/<Override[^>]*calcChain[^>]*\/>/', '', $content);
                $zip->deleteName($ctPath);
                $zip->addFromString($ctPath, $content);
            }

            $zip->close();
        }

        $size = round(filesize($dst) / 1024, 1);
        $this->info("✓ Template cleaned successfully! Size: {$size} KB");
        $this->info("Location: {$dst}");

        return 0;
    }
}
