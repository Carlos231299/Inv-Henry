import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/currency';

export const useCurrency = () => {
  const { settings } = useConfig();
  
  const format = (value: number) => {
    // Si la moneda es COP, multiplicamos por 1000 para pasar de escala de unidad a miles
    const displayValue = settings.currency === 'COP' ? value * 1000 : value;
    return formatCurrency(displayValue, settings.currency, settings.currency_locale);
  };

  return { format, currency: settings.currency };
};
