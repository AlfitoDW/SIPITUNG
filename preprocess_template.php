<?php

// Pre-process template: keep only 7 sheets, remove external links, calcChain
$src = 'bahan_keuangan/Ref. - User, Pegawai  dan Daftar Nominatif.xlsx';
$dst = 'storage/app/templates/nominatif_template_preprocessed.xlsx';

copy($src, $dst);

$zip = new ZipArchive;
$zip->open($dst);

// Get workbook.xml
$wb = $zip->getFromName('xl/workbook.xml');
$wbXml = new SimpleXMLElement($wb);

// Sheets to keep
$keep = ['521115', '521213', '522151', '524111', '524113', '524114', '524119'];

// Find sheets to remove
$sheetsToRemove = [];
$sheetIdToRemove = [];
foreach ($wbXml->sheets->sheet as $sheet) {
    $name = (string) $sheet['name'];
    $sheetId = (string) $sheet['sheetId'];
    if (! in_array($name, $keep)) {
        $sheetsToRemove[] = $name;
        $sheetIdToRemove[] = $sheetId;
    }
}

echo 'Sheets to remove: '.implode(', ', $sheetsToRemove)."\n";

// Get workbook rels to find sheet file mappings
$wbRels = $zip->getFromName('xl/_rels/workbook.xml.rels');
$relsXml = new SimpleXMLElement($wbRels);

$sheetFilesToRemove = [];
$relsToRemove = [];

foreach ($relsXml->Relationship as $rel) {
    $type = (string) $rel['Type'];
    $target = (string) $rel['Target'];
    $id = (string) $rel['Id'];

    if (strpos($type, 'worksheet') !== false) {
        // Extract sheet number from target (e.g., worksheets/sheet1.xml)
        if (preg_match('/sheet(\d+)\.xml$/', $target, $m)) {
            $sheetNum = $m[1];
            // Check if this sheet is in our remove list
            // We need to map sheet number to sheetId
            // This is complex, let's use a different approach
        }
    }

    // Remove external link rels
    if (strpos($type, 'externalLink') !== false) {
        $relsToRemove[] = $id;
    }
}

// Better approach: just rebuild the workbook.xml with only keep sheets
$wbXml->sheets = '';
$sheetId = 1;
foreach ($keep as $name) {
    // Find the original sheet in workbook
    $originalSheet = null;
    foreach ($wbXml->sheets->sheet as $s) {
        if ((string) $s['name'] === $name) {
            $originalSheet = $s;
            break;
        }
    }

    // Add to new sheets
    $newSheet = $wbXml->sheets->addChild('sheet');
    $newSheet['name'] = $name;
    $newSheet['sheetId'] = $sheetId;
    $newSheet['r:id'] = 'rId'.$sheetId; // We'll fix this
    $sheetId++;
}

// Save workbook
$wbContent = $wbXml->asXML();
$wbContent = str_replace('<?xml version="1.0"?>', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', $wbContent);
$zip->deleteName('xl/workbook.xml');
$zip->addFromString('xl/workbook.xml', $wbContent);

// Now remove unused sheet files
for ($i = $zip->numFiles - 1; $i >= 0; $i--) {
    $name = $zip->getNameIndex($i);

    // Remove external link files
    if (strpos($name, 'xl/externalLinks/') === 0) {
        $zip->deleteIndex($i);

        continue;
    }

    // Remove calcChain
    if (strpos($name, 'xl/calcChain.xml') !== false) {
        $zip->deleteIndex($i);

        continue;
    }

    // Remove external link rels
    if (strpos($name, 'xl/externalLinks/_rels/') === 0) {
        $zip->deleteIndex($i);

        continue;
    }
}

// Update workbook rels
$wbRels = $zip->getFromName('xl/_rels/workbook.xml.rels');
$relsXml = new SimpleXMLElement($wbRels);

$newRels = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
$rid = 1;

// Add styles
$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId'.$rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles';
$rel['Target'] = 'styles.xml';
$rid++;

// Add theme
$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId'.$rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme';
$rel['Target'] = 'theme/theme1.xml';
$rid++;

// Add sharedStrings
$rel = $newRels->addChild('Relationship');
$rel['Id'] = 'rId'.$rid;
$rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings';
$rel['Target'] = 'sharedStrings.xml';
$rid++;

// Add sheets
foreach ($keep as $index => $name) {
    $sheetNum = $index + 1;
    $rel = $newRels->addChild('Relationship');
    $rel['Id'] = 'rId'.$rid;
    $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
    $rel['Target'] = 'worksheets/sheet'.$sheetNum.'.xml';
    $rid++;
}

$zip->deleteName('xl/_rels/workbook.xml.rels');
$zip->addFromString('xl/_rels/workbook.xml.rels', $newRels->asXML());

// Update Content_Types
$ct = $zip->getFromName('[Content_Types].xml');
$ctXml = new SimpleXMLElement($ct);

// Remove external link content types
foreach ($ctXml->Override as $override) {
    $partName = (string) $override['PartName'];
    if (strpos($partName, 'externalLink') !== false) {
        unset($override[0]);
    }
}

// Remove calcChain content type
foreach ($ctXml->Override as $override) {
    $partName = (string) $override['PartName'];
    if (strpos($partName, 'calcChain') !== false) {
        unset($override[0]);
    }
}

$zip->deleteName('[Content_Types].xml');
$zip->addFromString('[Content_Types].xml', $ctXml->asXML());

$zip->close();

echo "Template preprocessed successfully!\n";
echo "Output: $dst\n";
