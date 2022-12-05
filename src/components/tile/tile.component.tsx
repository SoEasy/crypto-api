import React from 'react';
import styles from './tile.module.scss';

export function Tile(props: {children: React.ReactElement | Array<React.ReactElement>}): React.ReactElement {
  return <div className={styles.tile}>
    {props.children}
  </div>
}
