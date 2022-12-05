import classNames from 'classnames';
import React from 'react';
import styles from './sequence.module.scss';

export function Sequence(props: { children: React.ReactElement | Array<React.ReactElement> }): React.ReactElement {
  return <>
    {
      React.Children.map(props.children, (child: React.ReactElement, index: number) => {
        const cls = classNames(
          styles.sequence__container,
          index % 2 === 0 ? styles['sequence__container-left'] : styles['sequence__container-right']
        )
        return <div className={cls}>
          {child}
        </div>;
      })
    }
  </>;
}
