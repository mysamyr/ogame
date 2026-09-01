import type { ReactElement, SelectHTMLAttributes } from 'react';

import { classNames } from '../utils/index.js';

import styles from './Dropdown.module.css';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: DropdownOption[];
};

export default function Dropdown({
  options,
  className,
  ...props
}: DropdownProps): ReactElement {
  return (
    <select className={classNames(styles.dropdown, className)} {...props}>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
