import { type FC, type ChangeEventHandler, type ReactNode, useMemo, useCallback } from 'react';
import type { GetRegisterFieldOption } from '@inplayer-org/inplayer.js';

import Checkbox from '#components/Checkbox/Checkbox';
import TextField from '#components/TextField/TextField';
import Radio from '#components/Radio/Radio';
import Dropdown from '#components/Dropdown/Dropdown';
import DateField from '#components/DateField/DateField';
import { ConsentFieldVariants, REGISTER_FIELD_VARIANT } from '#src/services/inplayer.account.service';
import { countries, usStates } from '#static/json';

type Props = {
  type: ConsentFieldVariants;
  name: string;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
} & Partial<{
  label: ReactNode;
  placeholder: string;
  error: boolean;
  helperText: string;
  disabled: boolean;
  required: boolean;
  options: GetRegisterFieldOption;
}>;

export type CustomRegisterFieldCommonProps = Props;

export const CustomRegisterField: FC<Props> = ({ type, name, value = '', onChange, ...props }) => {
  const optionsList = useMemo(() => {
    const optionsObject = (() => {
      switch (type) {
        case REGISTER_FIELD_VARIANT.COUNTRY_SELECT:
          return countries;
        case REGISTER_FIELD_VARIANT.US_STATE_SELECT:
          return usStates;
        default:
          return props.options;
      }
    })();

    if (!optionsObject) {
      return [];
    }

    return Object.entries(optionsObject).map(([value, label]) => ({ value, label }));
  }, [type, props.options]);

  const changeHandler: ChangeEventHandler<HTMLInputElement> = useCallback(
    ({ currentTarget }) => {
      const value = type === REGISTER_FIELD_VARIANT.CHECKBOX ? (currentTarget as HTMLInputElement).checked : currentTarget.value;
      onChange(name, value);
    },
    [type, name, onChange],
  );

  const commonProps = { ...props, name, onChange: changeHandler };

  switch (type) {
    case REGISTER_FIELD_VARIANT.CHECKBOX:
      return <Checkbox {...commonProps} checked={value === true} />;
    case REGISTER_FIELD_VARIANT.INPUT:
      return <TextField {...commonProps} value={value as string} />;
    case REGISTER_FIELD_VARIANT.RADIO:
      return <Radio {...commonProps} values={optionsList} value={value as string} header={props.label} />;
    case REGISTER_FIELD_VARIANT.GENERIC_SELECT:
    case REGISTER_FIELD_VARIANT.COUNTRY_SELECT:
    case REGISTER_FIELD_VARIANT.US_STATE_SELECT:
      return <Dropdown {...commonProps} options={optionsList} value={value as string} defaultLabel={props.placeholder} fullWidth />;
    case REGISTER_FIELD_VARIANT.DATE_PICKER:
      return <DateField {...commonProps} value={value as string} onChange={(dateString: string) => onChange(name, dateString)} />;
  }

  return null;
};

export default CustomRegisterField;
