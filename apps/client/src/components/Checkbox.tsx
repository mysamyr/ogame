import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';

import { classNames } from '../utils/index.js';

import styles from './Checkbox.module.css';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  indeterminate?: boolean;
};

export default function Checkbox({
  className,
  indeterminate = false,
  ...props
}: CheckboxProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className={classNames(styles.checkbox, className)}
      {...props}
    />
  );
}
