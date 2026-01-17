import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useListPublicProductsQuery } from '../../../../src/api/publicProductApi';
import { CategoryQuickRow, type CategoryQuickItem } from '../../../../src/components/customer/CategoryQuickRow';
import { HomeHero } from '../../../../src/components/customer/HomeHero';
import { Screen } from '../../../../src/components/layout/Screen';
import { ProductCard, ProductCardSkeleton } from '../../../../src/components/product/ProductCard';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { useAppSelector } from '../../../../src/store/hooks';
import { getApiErrorMessage } from '../../../../src/utils/apiError';

const CATEGORIES: CategoryQuickItem[] = [
  { key: 'all', label: 'All' },
  { key: 'Home', label: 'Home' },
  { key: 'Fashion', label: 'Fashion' },
  { key: 'Art', label: 'Art' },
  { key: 'Food', label: 'Food' },
  { key: 'Decor', label: 'Decor' },
];

function guessFirstName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'there';
  const token = trimmed
    .split('@')[0]
    ?.replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)[0];
  const first = (token ?? 'there').trim();
  return first.length ? first[0].toUpperCase() + first.slice(1) : 'there';
}

export default function CustomerHomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  const firstName = useMemo(() => {
    const fromName = user?.name?.trim().split(' ').filter(Boolean)[0];
    if (fromName) return guessFirstName(fromName);
    if (user?.email) return guessFirstName(user.email);
    return 'there';
  }, [user?.email, user?.name]);

  const intro = useRef(new Animated.Value(0)).current;
  const introY = useRef(new Animated.Value(8)).current;

  const searchRef = useRef<TextInput | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const autoNavigated = useRef(false);

  const {
    data: featured,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useListPublicProductsQuery({ page: 1, limit: 10 });

  const featuredItems = useMemo(() => featured?.items ?? [], [featured?.items]);
  const trendingItems = useMemo(() => featuredItems.slice(0, 4), [featuredItems]);

  const goToProducts = useCallback(
    (params?: { search?: string; category?: string }) => {
      const searchValue = params?.search?.trim();
      const categoryValue = params?.category?.trim();
      const next: Record<string, string> = {};
      if (searchValue) next.search = searchValue;
      if (categoryValue && categoryValue !== 'all') next.category = categoryValue;
      router.push({ pathname: '/(app)/(customer)/products', params: next });
    },
    [router]
  );

  const onPressProduct = useCallback(
    (id: string) => {
      router.push(`/(app)/(customer)/products/${encodeURIComponent(id)}`);
    },
    [router]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(intro, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(introY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [intro, introY]);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      autoNavigated.current = false;
      return;
    }
    if (autoNavigated.current) return;
    if (q.length < 3) return;

    const t = setTimeout(() => {
      autoNavigated.current = true;
      goToProducts({ search: q, category: selectedCategory });
    }, 850);

    return () => clearTimeout(t);
  }, [goToProducts, search, selectedCategory]);

  const featuredCardStyle = useMemo<ViewStyle>(() => ({ width: 204 }), []);
  const sectionTop = useMemo(() => ({ marginTop: theme.spacing.xl }), [theme.spacing.xl]);

  const renderFeaturedItem = useCallback(
    ({ item }: { item: (typeof featuredItems)[number] }) => {
      return <ProductCard product={item} onPressProduct={onPressProduct} style={featuredCardStyle} />;
    },
    [featuredCardStyle, onPressProduct]
  );

  const featuredSeparator = useCallback(() => <View style={{ width: theme.spacing.md }} />, [theme.spacing.md]);

  const headerRight = useMemo(() => {
    const iconButton = (icon: React.ComponentProps<typeof Feather>['name'], label: string, onPress: () => void) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.iconButton,
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Feather name={icon} size={20} color="#FFFFFF" />
      </Pressable>
    );

    return (
      <View style={{ gap: theme.spacing.sm, flexDirection: 'row' }}>
        {iconButton('bell', 'Notifications', () => router.push('/(app)/(customer)/settings'))}
      </View>
    );
  }, [router, theme.radius.full, theme.spacing.sm]);

  return (
    <Screen scroll style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <Animated.View style={{ opacity: intro, transform: [{ translateY: introY }] }}>
        {/* Green header */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xxxxl,
            borderBottomLeftRadius: theme.radius.xxl,
            borderBottomRightRadius: theme.radius.xxl,
          }}
        >
          <View style={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: theme.typography.caption }}>
                  Welcome
                </Text>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: theme.typography.display,
                    letterSpacing: -0.8,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {firstName}
                </Text>
              </View>
              {headerRight}
            </View>

            <Input
              inputRef={searchRef}
              variant="search"
              label={undefined}
              placeholder="Search products"
              returnKeyType="search"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => goToProducts({ search, category: selectedCategory })}
              leadingIcon={<Feather name="search" size={18} color={theme.colors.mutedForeground} />}
            />
          </View>
        </View>

        {/* Promo card overlaps header */}
        <View style={{ marginTop: -theme.spacing.xl, paddingHorizontal: theme.spacing.md }}>
          <HomeHero onBrowseProducts={goToProducts} />
        </View>

        {/* Categories */}
        <View style={{ marginTop: theme.spacing.xl }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.foreground,
                  fontSize: theme.typography.h3,
                },
              ]}
            >
              Categories
            </Text>
            <Pressable onPress={() => goToProducts()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: theme.typography.bodySmall }}>
                See all
              </Text>
            </Pressable>
          </View>

          <CategoryQuickRow
            items={CATEGORIES}
            selectedKey={selectedCategory}
            onSelect={(key) => {
              setSelectedCategory(key);
              goToProducts(key === 'all' ? {} : { category: key });
            }}
            style={{ marginTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}
          />
        </View>

        <View style={[sectionTop, { marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.md }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { 
              color: theme.colors.foreground,
              fontSize: theme.typography.h3,
            }]}>
              Featured Products
            </Text>
            <Pressable onPress={() => goToProducts()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ 
                color: theme.colors.primaryDark, 
                fontWeight: '800',
                fontSize: theme.typography.bodySmall,
              }}>
                See all
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
              <ProductCardSkeleton style={featuredCardStyle} />
              <ProductCardSkeleton style={featuredCardStyle} />
              <ProductCardSkeleton style={featuredCardStyle} />
            </View>
          ) : error ? (
            <Card style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h4 }}>
                Couldn't load products
              </Text>
              <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>
                {getApiErrorMessage(error)}
              </Text>
              <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
            </Card>
          ) : featuredItems.length === 0 ? (
            <Card variant="tinted" style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h4 }}>
                No products yet
              </Text>
              <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>
                Check back soon for new listings.
              </Text>
            </Card>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderFeaturedItem}
              ItemSeparatorComponent={featuredSeparator}
              style={{ marginTop: theme.spacing.lg }}
              contentContainerStyle={{ paddingRight: theme.spacing.md }}
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews
            />
          )}
        </View>

        <View
          style={[
            sectionTop,
            { marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xxxl, paddingHorizontal: theme.spacing.md },
          ]}
        >
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { 
              color: theme.colors.foreground,
              fontSize: theme.typography.h3,
            }]}>
              Trending Now
            </Text>
            <Pressable onPress={() => goToProducts()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ 
                color: theme.colors.primaryDark, 
                fontWeight: '800',
                fontSize: theme.typography.bodySmall,
              }}>
                See all
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row' }}>
                <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
                <View style={{ width: theme.spacing.md }} />
                <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
              </View>
              <View style={{ height: theme.spacing.md }} />
              <View style={{ flexDirection: 'row' }}>
                <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
                <View style={{ width: theme.spacing.md }} />
                <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
              </View>
            </View>
          ) : trendingItems.length ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row' }}>
                <ProductCard
                  variant="grid"
                  product={trendingItems[0]!}
                  onPressProduct={onPressProduct}
                  style={{ flex: 1 }}
                />
                <View style={{ width: theme.spacing.md }} />
                {trendingItems[1] ? (
                  <ProductCard
                    variant="grid"
                    product={trendingItems[1]}
                    onPressProduct={onPressProduct}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>

              <View style={{ height: theme.spacing.md }} />

              <View style={{ flexDirection: 'row' }}>
                {trendingItems[2] ? (
                  <ProductCard
                    variant="grid"
                    product={trendingItems[2]}
                    onPressProduct={onPressProduct}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <View style={{ width: theme.spacing.md }} />
                {trendingItems[3] ? (
                  <ProductCard
                    variant="grid"
                    product={trendingItems[3]}
                    onPressProduct={onPressProduct}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
