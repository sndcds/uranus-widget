import { defineCustomElement } from 'vue'
import UranusWidget from './UranusWidget.vue'

export const UranusWidgetElement = defineCustomElement(UranusWidget)

customElements.define('uranus-widget', UranusWidgetElement)
