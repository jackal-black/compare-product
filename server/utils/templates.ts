import phoneTemplate from '../data/templates/phone.json'
import laptopTemplate from '../data/templates/laptop.json'
import headphoneTemplate from '../data/templates/headphone.json'
import monitorTemplate from '../data/templates/monitor.json'
import mouseTemplate from '../data/templates/mouse.json'
import keyboardTemplate from '../data/templates/keyboard.json'

export interface TemplateField {
  key: string
  label: string
  unit?: string
}

export interface TemplateSection {
  id: string
  label: string
  fields: TemplateField[]
}

export interface CategoryTemplate {
  id: string
  name: string
  icon: string
  sections: TemplateSection[]
}

const templates: Record<string, CategoryTemplate> = {
  phone: phoneTemplate as CategoryTemplate,
  laptop: laptopTemplate as CategoryTemplate,
  headphone: headphoneTemplate as CategoryTemplate,
  monitor: monitorTemplate as CategoryTemplate,
  mouse: mouseTemplate as CategoryTemplate,
  keyboard: keyboardTemplate as CategoryTemplate,
}

export function getTemplate(categoryId: string): CategoryTemplate | null {
  return templates[categoryId] ?? null
}

export function getAllTemplates(): CategoryTemplate[] {
  return Object.values(templates)
}

export function getAllTemplateMeta() {
  return Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    sectionCount: t.sections.length,
    fieldCount: t.sections.reduce((sum, s) => sum + s.fields.length, 0),
  }))
}

/**
 * From a flat spec map, extract only fields that match the template.
 * Returns { sectionId: { fieldKey: value } }
 */
export function extractSpecsByTemplate(
  template: CategoryTemplate,
  specs: Record<string, string>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}
  for (const section of template.sections) {
    result[section.id] = {}
    for (const field of section.fields) {
      result[section.id][field.key] = specs[field.key] || ''
    }
  }
  return result
}
