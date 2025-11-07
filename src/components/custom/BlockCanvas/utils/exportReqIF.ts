'use client';

import { saveWithPicker } from '@/components/custom/BlockCanvas/utils/exportCsv';

// Minimal ReqIF (experimental) - defines simple STRING datatypes and a single SpecObjectType
export function buildReqIFXml(
    headers: string[],
    rows: Array<Array<unknown>>,
    options?: { specificationName?: string; includeHeader?: boolean },
): string {
    const specName = options?.specificationName || 'Exported Specification';
    const now = new Date().toISOString();

    // Create GUID-like identifiers
    let counter = 0;
    const genId = (prefix: string) =>
        `${prefix}-${++counter}-${Math.random().toString(36).slice(2, 10)}`;

    // Datatypes (single STRING type reused for all attributes)
    const dataTypeId = genId('DT-STRING');

    // Attribute definitions for headers
    const attrDefs = headers.map((h) => {
        const id = genId('AD-STR');
        return { id, name: h || 'Column' };
    });

    // SpecObjectType that holds all attributes
    const specObjectTypeId = genId('SOT');

    // Build AttributeDefinitionString elements
    const attrDefXml = attrDefs
        .map((d) =>
            `
        <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="${d.id}" LAST-CHANGE="${now}" LONG-NAME="${xmlEscape(
            d.name,
        )}">
          <TYPE>
            <DATATYPE-DEFINITION-STRING-REF>${dataTypeId}</DATATYPE-DEFINITION-STRING-REF>
          </TYPE>
        </ATTRIBUTE-DEFINITION-STRING>`.trim(),
        )
        .join('');

    // Build SpecObjects: one per row
    const specObjectsXml = rows
        .map((r) => {
            const soId = genId('SO');
            const values = r
                .map((cell, idx) => {
                    const def = attrDefs[idx];
                    const value = cell == null ? '' : String(cell);
                    return `
            <ATTRIBUTE-VALUE-STRING>
              <DEFINITION>
                <ATTRIBUTE-DEFINITION-STRING-REF>${def.id}</ATTRIBUTE-DEFINITION-STRING-REF>
              </DEFINITION>
              <THE-VALUE>${xmlEscape(value)}</THE-VALUE>
            </ATTRIBUTE-VALUE-STRING>`.trim();
                })
                .join('');
            return `
        <SPEC-OBJECT IDENTIFIER="${soId}" LAST-CHANGE="${now}" LONG-NAME="">
          <TYPE>
            <SPEC-OBJECT-TYPE-REF>${specObjectTypeId}</SPEC-OBJECT-TYPE-REF>
          </TYPE>
          <VALUES>${values}</VALUES>
        </SPEC-OBJECT>`.trim();
        })
        .join('');

    // Create a simple SPECIFICATION that lists all SpecObjects as children (as SPEC-OBJECT-REFS)
    const specId = genId('SPEC');
    const specHierarchy = rows
        .map((_r, _i) => {
            // We don't have the actual IDs from above easily; for a minimal approach, omit hierarchy.
            // Many tools accept empty hierarchy. Leaving it empty is safest for now.
            return '';
        })
        .join('');

    // Complete XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd">
  <THE-HEADER>
    <REQ-IF-HEADER IDENTIFIER="${genId('HDR')}" LAST-CHANGE="${now}" TOOL-ID="atoms.tech" VERSION="1.0"/>
  </THE-HEADER>
  <CORE-CONTENT>
    <REQ-IF-CONTENT>
      <DATATYPES>
        <DATATYPE-DEFINITION-STRING IDENTIFIER="${dataTypeId}" LAST-CHANGE="${now}" LONG-NAME="String"/>
      </DATATYPES>
      <SPEC-TYPES>
        <SPEC-OBJECT-TYPE IDENTIFIER="${specObjectTypeId}" LAST-CHANGE="${now}" LONG-NAME="Requirement">
          <SPEC-ATTRIBUTES>
            ${attrDefXml}
          </SPEC-ATTRIBUTES>
        </SPEC-OBJECT-TYPE>
      </SPEC-TYPES>
      <SPEC-OBJECTS>
        ${specObjectsXml}
      </SPEC-OBJECTS>
      <SPEC-RELATIONS/>
      <SPECIFICATIONS>
        <SPECIFICATION IDENTIFIER="${specId}" LAST-CHANGE="${now}" LONG-NAME="${xmlEscape(specName)}">
          <TYPE/>
          <CHILDREN>
            ${specHierarchy}
          </CHILDREN>
        </SPECIFICATION>
      </SPECIFICATIONS>
    </REQ-IF-CONTENT>
  </CORE-CONTENT>
  <TOOL-EXTENSIONS/>
</REQ-IF>`.trim();
}

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function saveReqIF(
    headers: string[],
    rows: Array<Array<unknown>>,
    options: { includeHeader: boolean; specificationName?: string },
    suggestedName: string,
) {
    // For ReqIF, headers define attribute names; includeHeader toggle is not used for data rows.
    // If includeHeader is false and headers are empty, synthesize default names.
    const effHeaders =
        headers && headers.length > 0
            ? headers
            : rows.length > 0
              ? rows[0].map((_c, i) => `Column ${i + 1}`)
              : ['Name', 'Description'];

    const xml = buildReqIFXml(effHeaders, rows, {
        includeHeader: true,
        specificationName: options.specificationName,
    });
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    await saveWithPicker(blob, suggestedName);
}
