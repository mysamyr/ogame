import type { InputHTMLAttributes, ReactElement } from 'react';

import { classNames } from '../utils/index.js';

import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  className,
  type = 'text',
  ...props
}: InputProps): ReactElement {
  return (
    <input
      type={type}
      className={classNames(styles.input, className)}
      {...props}
    />
  );
}
