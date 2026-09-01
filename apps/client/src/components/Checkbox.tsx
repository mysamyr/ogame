import type { InputHTMLAttributes, ReactElement } from 'react';

import { classNames } from '../utils/index.js';

import styles from './Checkbox.module.css';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function Checkbox({
  className,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <input
      type="checkbox"
      className={classNames(styles.checkbox, className)}
      {...props}
    />
  );
}
