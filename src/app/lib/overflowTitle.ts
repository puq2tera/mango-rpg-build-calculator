export function syncOverflowTitle(element: HTMLElement, tooltipText?: string | null) {
  const normalizedText = (tooltipText ?? element.textContent ?? "").trim()

  if (!normalizedText) {
    element.removeAttribute("title")
    return
  }

  const hasHorizontalOverflow = element.scrollWidth > element.clientWidth + 1
  const hasVerticalOverflow = element.scrollHeight > element.clientHeight + 1

  if (hasHorizontalOverflow || hasVerticalOverflow) {
    element.setAttribute("title", normalizedText)
    return
  }

  element.removeAttribute("title")
}
