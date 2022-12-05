import styles from './accordion.module.scss';
import classNames from 'classnames';
import React, { useState } from 'react';

export function Accordion(props: { title: string; children: React.ReactElement }): React.ReactElement {
  const [expanded, setExpanded] = useState<boolean>(false);

  return <div className={styles.accordion__container}>
    <div className={styles.accordion__header} onClick={() => { setExpanded(p => !p); }}>
      {props.title}
    </div>
    <div className={
      classNames(styles.accordion__content, { [styles['accordion__content-expanded']]: expanded })}>
      {props.children}
    </div>
  </div>
}
