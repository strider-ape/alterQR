/**
 * NeoShadow — wraps children in a Neo-Brutalist hard-offset black shadow.
 *
 * The shadow is a static black View sitting behind the child content.
 * The outer container has bottom+right padding equal to `offset` to carve
 * out room for the shadow, so the element takes exactly the right amount
 * of layout space without overflow hacks.
 *
 * Usage:
 *   <NeoShadow offset={4}>
 *     <View className="border-4 border-black bg-yellow-400 px-6 py-4">
 *       <Text>Button</Text>
 *     </View>
 *   </NeoShadow>
 */

import { ReactNode } from 'react';
import { View } from 'react-native';

interface NeoShadowProps {
  children: ReactNode;
  /** Shadow offset in pixels. Defaults to 4. */
  offset?: number;
  /** Background color of the shadow. Defaults to #000. */
  color?: string;
}

export function NeoShadow({ children, offset = 4, color = '#000' }: NeoShadowProps) {
  return (
    <View style={{ paddingRight: offset, paddingBottom: offset }}>
      {/* Static shadow layer — rendered first so content sits on top */}
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          bottom: 0,
          right: 0,
          backgroundColor: color,
        }}
      />
      {/* Content layer */}
      {children}
    </View>
  );
}
