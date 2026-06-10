<?php

/**
 * Script untuk membersihkan template Nominatif:
 * - Hapus named ranges
 * - Hapus formulas
 * - Hapus external links
 * - Hapus calcChain
 * - Hapus sheet tidak relevan (hanya sisakan 7 sheet: 521115, 521213, 522151, 524111, 524113, 524114, 524119)
 * - Clear data dummy
 */

$sourceFile = __DIR__ . '/bahan_keuangan/Ref. - User, Pegawai  dan Daftar Nominatif.xlsx';
$destFile = __DIR__ . '/storage/app/templates/nominatif_template_clean.xlsx';

if (!file_exists($sourceFile)) {
    echo "Error: Source file not found: $sourceFile\n";
    exit(1);
}

// Ensure destination directory exists
$destDir = dirname($destFile);
if (!is_dir($destDir)) {
    mkdir($destDir, 0755, true);
}

// Copy to temp file
$tempFile = tempnam(sys_get_temp_dir(), 'nominatif_clean_');
copy($sourceFile, $tempFile);

$zip = new ZipArchive();
$zip->open($tempFile);

// --- 1. Remove named ranges from workbook.xml ---
$wb = $zip->getFromName('xl/workbook.xml');
$wbXml = new SimpleXMLElement($wb);

// Remove definedNames (named ranges)
if ($wbXml->definedNames) {
    unset($wbXml->definedNames[0]);
}

// Remove externalReferences
if ($wbXml->externalReferences) {
    unset($wbXml->externalReferences[0]);
}

$zip->deleteName('xl/workbook.xml');
$zip->addFromString('xl/workbook.xml', $wbXml->asXML());

// --- 2. Remove externalLinks ---
$externalLinksDir = 'xl/externalLinks/';
$index = 0;
while (true) {
    $name = $externalLinksDir . 'externalLink' . ($index + 1) . '.xml';
    if ($zip->locateName($name) === false) {
        break;
    }
    $zip->deleteName($name);
    $index++;
}

// Remove externalLinks rels
$zip->deleteName('xl/externalLinks/_rels/externalLink1.xml.rels');

// --- 3. Remove calcChain ---
$zip->deleteName('xl/calcChain.xml');

// --- 4. Remove named ranges from worksheet rels ---
$relsDir = 'xl/worksheets/_rels/';
$index = 0;
while (true) {
    $name = $relsDir . 'sheet' . ($index + 1) . '.xml.rels';
    if ($zip->locateName($name) === false) {
        break;
    }
    
    $rels = $zip->getFromName($name);
    $relsXml = new SimpleXMLElement($rels);
    
    // Remove externalLink relationships
    foreach ($relsXml->Relationship as $rel) {
        $type = (string)$rel['Type'];
        if (strpos($type, 'externalLink') !== false) {
            unset($rel[0]);
        }
    }
    
    $zip->deleteName($name);
    $zip->addFromString($name, $relsXml->asXML());
    $index++;
}

// --- 5. Remove unused sheets ---
$wb = $zip->getFromName('xl/workbook.xml');
$wbXml = new SimpleXMLElement($wb);

// Map sheet names to their targets
$sheetMap = [];
$rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
$relsXml = new SimpleXMLElement($rels);
$rIdMap = [];
foreach ($relsXml->Relationship as $rel) {
    $rIdMap[(string)$rel['Id']] = (string)$rel['Target'];
}

foreach ($wbXml->sheets->sheet as $sheet) {
    $name = (string)$sheet['name'];
    // Get r:id with namespace
    $attrs = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
    $rid = (string)($attrs['id'] ?? '');
    $sheetMap[$name] = $rIdMap[$rid] ?? null;
}

// Sheets to keep
$keepSheets = ['521115', '521213', '522151', '524111', '524113', '524114', '524119'];

// Remove unused sheets
$sheetIndex = 0;
foreach ($sheetMap as $name => $target) {
    if (!in_array($name, $keepSheets)) {
        // Remove sheet file
        $zip->deleteName('xl/' . $target);
        // Remove rels file
        $zip->deleteName('xl/worksheets/_rels/' . basename($target) . '.rels');
    }
    $sheetIndex++;
}

// Rebuild workbook.xml with only kept sheets
// Remove old sheets element
$dom = dom_import_simplexml($wbXml);
$xpath = new DOMXPath($dom->ownerDocument);
$xpath->registerNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

$sheetsElements = $xpath->query('//s:sheets');
foreach ($sheetsElements as $sheetsElement) {
    $sheetsElement->parentNode->removeChild($sheetsElement);
}

// Add new sheets element
$newSheets = $wbXml->addChild('sheets');
$sheetId = 1;
$rid = 1;
foreach ($keepSheets as $name) {
    if (!isset($sheetMap[$name]) || $sheetMap[$name] === null) continue;
    
    $sheet = $newSheets->addChild('sheet');
    $sheet['name'] = $name;
    $sheet['sheetId'] = $sheetId;
    // Add r:id attribute with namespace
    $sheet->addAttribute('r:id', 'rId' . $rid, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
    $sheetId++;
    $rid++;
}

$zip->deleteName('xl/workbook.xml');
$zip->addFromString('xl/workbook.xml', $wbXml->asXML());

// Rebuild workbook rels
$newRels = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');

$rid = 1;
foreach ($keepSheets as $name) {
    if (!isset($sheetMap[$name])) continue;
    
    $rel = $newRels->addChild('Relationship');
    $rel['Id'] = 'rId' . $rid;
    $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
    $rel['Target'] = $sheetMap[$name];
    $rid++;
}

// Add styles, theme, sharedStrings
$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId' . $rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles';
$rel['Target'] = 'styles.xml';
$rid++;

$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId' . $rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme';
$rel['Target'] = 'theme/theme1.xml';
$rid++;

$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId' . $rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings';
$rel['Target'] = 'sharedStrings.xml';
$rid++;

$zip->deleteName('xl/_rels/workbook.xml.rels');
$zip->addFromString('xl/_rels/workbook.xml.rels', $newRels->asXML());

// --- 6. Update Content_Types.xml ---
$ct = $zip->getFromName('[Content_Types].xml');
$ctXml = new SimpleXMLElement($ct);

// Remove unused worksheet content types
$overrides = $ctXml->Override;
for ($i = count($overrides) - 1; $i >= 0; $i--) {
    $partName = (string)$overrides[$i]['PartName'];
    if (preg_match('/xl\/worksheets\/sheet\d+\.xml/', $partName)) {
        $sheetNum = (int)preg_replace('/.*sheet(\d+)\.xml/', '$1', $partName);
        if ($sheetNum > count($keepSheets)) {
            unset($overrides[$i][0]);
        }
    }
}

// Remove externalLink content types
for ($i = count($overrides) - 1; $i >= 0; $i--) {
    $partName = (string)$overrides[$i]['PartName'];
    if (strpos($partName, 'externalLink') !== false) {
        unset($overrides[$i][0]);
    }
}

// Remove calcChain content type
for ($i = count($overrides) - 1; $i >= 0; $i--) {
    $partName = (string)$overrides[$i]['PartName'];
    if ($partName === '/xl/calcChain.xml') {
        unset($overrides[$i][0]);
    }
}

$zip->deleteName('[Content_Types].xml');
$zip->addFromString('[Content_Types].xml', $ctXml->asXML());

// --- 7. Clear data dummy from all sheets ---
foreach ($keepSheets as $sheetName) {
    if (!isset($sheetMap[$sheetName])) continue;
    
    $sheetFile = 'xl/' . $sheetMap[$sheetName];
    $sheetContent = $zip->getFromName($sheetFile);
    $sheetXml = new SimpleXMLElement($sheetContent);
    
    // Clear data rows (rows 12-14 for 521115, 14-16 for 521213, etc.)
    $dataStartRow = match($sheetName) {
        '521115' => 12,
        '521213', '522151' => 14,
        '524111', '524113', '524114', '524119' => 14,
    };
    
    $dataEndRow = match($sheetName) {
        '521115' => 14,
        '521213', '522151' => 16,
        '524111', '524113', '524114', '524119' => 44,
    };
    
    foreach ($sheetXml->sheetData->row as $row) {
        $rowNum = (int)$row['r'];
        if ($rowNum >= $dataStartRow && $rowNum <= $dataEndRow) {
            foreach ($row->c as $cell) {
                unset($cell->v);
                unset($cell->f);
            }
        }
    }
    
    $zip->deleteName($sheetFile);
    $zip->addFromString($sheetFile, $sheetXml->asXML());
}

$zip->close();

// Move to destination
copy($tempFile, $destFile);
unlink($tempFile);

echo "Template cleaned successfully!\n";
echo "Source: $sourceFile\n";
echo "Destination: $destFile\n";
echo "Sheets kept: " . implode(', ', $keepSheets) . "\n";
