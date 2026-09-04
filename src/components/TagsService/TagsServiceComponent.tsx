/**
 * TagsService — Global tag management.
 */

import React, { useState } from 'react';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface Tag { key: string; value: string; }

export function TagsServiceComponent(): React.ReactElement {
  const [tags, setTags] = useState<Tag[]>([]);

  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>Tags</h3>
      {tags.map((tag, idx) => (
        <SpaceBetween key={idx} direction="horizontal" size="xs">
          <Input value={tag.key} onChange={e => { const t = [...tags]; t[idx] = { ...t[idx], key: e.detail.value }; setTags(t); }} placeholder="Key" />
          <Input value={tag.value} onChange={e => { const t = [...tags]; t[idx] = { ...t[idx], value: e.detail.value }; setTags(t); }} placeholder="Value" />
          <Button iconName="close" onClick={() => setTags(tags.filter((_, i) => i !== idx))} />
        </SpaceBetween>
      ))}
      <Button iconName="add-plus" onClick={() => setTags([...tags, { key: '', value: '' }])}>Add tag</Button>
    </SpaceBetween>
  );
}
