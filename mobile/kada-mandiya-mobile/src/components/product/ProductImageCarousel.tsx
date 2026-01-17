import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../providers/ThemeProvider';

type Props = {
  imageUrls: (string | null | undefined)[];
  height: number;
  loading?: boolean;
};

function normalizeUrls(imageUrls: (string | null | undefined)[]): string[] {
  return imageUrls
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => Boolean(v) && /^https?:\/\//i.test(v));
}

export function ProductImageCarousel({ imageUrls, height, loading }: Props) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const urls = useMemo(() => normalizeUrls(imageUrls), [imageUrls]);

  const modalListRef = useRef<FlatList<string> | null>(null);

  const [index, setIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    if (!urls.length) {
      if (index !== 0) setIndex(0);
      return;
    }
    if (index > urls.length - 1) setIndex(0);
  }, [index, urls.length]);

  const onScrollEnd = useCallback(
    (e: any) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const next = Math.round(x / Math.max(1, width));
      setIndex(Math.max(0, Math.min(urls.length - 1, next)));
    },
    [urls.length, width]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, i: number) => ({ length: width, offset: width * i, index: i }),
    [width]
  );

  const openViewer = useCallback(() => {
    if (!urls.length) return;
    setViewerVisible(true);
    requestAnimationFrame(() => {
      modalListRef.current?.scrollToIndex({ index, animated: false });
    });
  }, [index, urls.length]);

  const closeViewer = useCallback(() => setViewerVisible(false), []);

  const dots = useMemo(() => {
    if (urls.length <= 1) return null;
    return (
      <View style={[styles.dots, { bottom: theme.spacing.sm, gap: theme.spacing.xs }]}>
        {urls.map((_, i) => {
          const active = i === index;
          return (
            <View
              key={String(i)}
              style={{
                width: active ? 18 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              }}
            />
          );
        })}
      </View>
    );
  }, [index, theme.spacing.sm, theme.spacing.xs, urls]);

  if (loading) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="image" size={40} color="rgba(255,255,255,0.9)" />
      </View>
    );
  }

  if (!urls.length) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="image" size={44} color="rgba(255,255,255,0.9)" />
        <Text style={{ marginTop: theme.spacing.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '800' }}>
          No image
        </Text>
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={openViewer} style={{ height }}>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={urls}
          keyExtractor={(u, i) => `${u}-${i}`}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={getItemLayout}
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}
        />

        {urls.length > 1 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              left: theme.spacing.sm,
              backgroundColor: 'rgba(0,0,0,0.28)',
              borderRadius: theme.radius.full,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: theme.typography.caption }}>
              {index + 1}/{urls.length}
            </Text>
          </View>
        ) : null}

        {dots}
      </Pressable>

      <Modal visible={viewerVisible} animationType="fade" transparent onRequestClose={closeViewer}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.xl,
              left: theme.spacing.md,
              right: theme.spacing.md,
              zIndex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable onPress={closeViewer} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={20} color="#FFFFFF" />
              </View>
            </Pressable>

            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>
              {index + 1}/{urls.length}
            </Text>
          </View>

          <FlatList
            ref={(r) => {
              modalListRef.current = r;
            }}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            showsHorizontalScrollIndicator={false}
            data={urls}
            keyExtractor={(u, i) => `viewer-${u}-${i}`}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={onScrollEnd}
            renderItem={({ item }) => (
              <View style={{ width, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri: item }} style={{ width: width, height: '100%' }} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
