export const formatPrice = (price?: number): string => {
  // Проверяем, что цена определена и является числом
  if (price === undefined || price === null || isNaN(price)) {
    return "0"
  }
  return price.toLocaleString("ru-RU")
}
