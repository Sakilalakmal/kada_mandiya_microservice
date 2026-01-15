import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, type TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useListPublicProductsQuery } from '../../../../src/api/publicProductApi';
import { CategoryChips, type CategoryChip } from '../../../../src/components/customer/CategoryChips';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { ProductCard, ProductCardSkeleton } from '../../../../src/components/product/ProductCard';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import type { Product } from '../../../../src/types/product.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';

const CATEGORIES: CategoryChip[] = [
  { key: 'all', label: 'All' },
  { key: 'Home', label: 'Home' },
  { key: 'Fashion', label: 'Fashion' },
  { key: 'Art', label: 'Art' },
  { key: 'Food', label: 'Food' },
  { key: 'Decor', label: 'Decor' },
];

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

function mergeUniqueById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  if (prev.length === 0) return next;
  if (next.length === 0) return prev;
  const map = new Map<string, T>();
  for (const item of prev) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return Array.from(map.values());
}

export default function CustomerProductsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string | string[]; category?: string | string[] }>();

  const searchParam = singleParam(params.search);
  const categoryParam = singleParam(params.category);
  const selectedCategory = categoryParam ?? 'all';

  const searchRef = useRef<TextInput | null>(null);
  const [draftSearch, setDraftSearch] = useState(searchParam ?? '');

  const [page, setPage] = useState(1);
  const limit = 12;
  const [items, setItems] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setDraftSearch(searchParam ?? '');
  }, [searchParam]);

  const query = useMemo(() => {
    return {
      page,
      limit,
      search: searchParam,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    };
  }, [limit, page, searchParam, selectedCategory]);

  const { data, isLoading, isFetching, error, refetch } = useListPublicProductsQuery(query);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [searchParam, selectedCategory]);

  useEffect(() => {
    if (!data) return;
    setTotalPages(data.totalPages);
    setItems((prev) => (page === 1 ? data.items : mergeUniqueById(prev, data.items)));
  }, [data, page]);

  const setQueryParams = useCallback(
    (next: { search?: string; category?: string }) => {
      const cleanSearch = next.search?.trim();
      const cleanCategory = next.category?.trim();
      setPage(1);
      setItems([]);
      setTotalPages(1);
      router.setParams({
        search: cleanSearch ? cleanSearch : undefined,
        category: cleanCategory && cleanCategory !== 'all' ? cleanCategory : undefined,
      });
    },
    [router]
  );

  const onSubmitSearch = useCallback(() => {
    const s = draftSearch.trim();
    setQueryParams({ search: s || undefined, category: selectedCategory });
  }, [draftSearch, selectedCategory, setQueryParams]);

  const onPressProduct = useCallback(
    (id: string) => {
      router.push(`/(app)/(customer)/products/${encodeURIComponent(id)}`);
    },
    [router]
  );

  const canLoadMore = page < totalPages;

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const right = index % 2 === 0 ? theme.spacing.md : 0;
      return (
        <View style={{ flex: 1, marginRight: right, marginBottom: theme.spacing.md }}>
          <ProductCard variant="grid" product={item} onPressProduct={onPressProduct} />
        </View>
      );
    },
    [onPressProduct, theme.spacing.md]
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const skeletonGrid = useMemo(() => {
    return (
      <View style={{ marginTop: theme.spacing.sm }}>
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
        <View style={{ height: theme.spacing.md }} />
        <View style={{ flexDirection: 'row' }}>
          <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
          <View style={{ width: theme.spacing.md }} />
          <ProductCardSkeleton variant="grid" style={{ flex: 1 }} />
        </View>
      </View>
    );
  }, [theme.spacing.md, theme.spacing.sm]);

  const hasActiveFilters = Boolean(searchParam) || selectedCategory !== 'all';

  return (
    <Screen scroll>
      <Header title="Products" subtitle="Browse items from vendors" canGoBack />

      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Input
            inputRef={searchRef}
            label={undefined}
            placeholder="Search products"
            returnKeyType="search"
            value={draftSearch}
            onChangeText={setDraftSearch}
            onSubmitEditing={onSubmitSearch}
            leadingIcon={<Feather name="search" size={18} color={theme.colors.placeholder} />}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => {
                searchRef.current?.focus();
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ color: theme.colors.mutedForeground, fontWeight: '500', fontSize: theme.typography.caption }}>
                {searchParam ? `Search: "${searchParam}"` : 'Type to search products...'}
              </Text>
            </Pressable>

            {draftSearch.trim() ? (
              <Pressable
                onPress={() => {
                  setDraftSearch('');
                  setQueryParams({ search: undefined, category: selectedCategory });
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View>
          <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h4, letterSpacing: -0.3 }}>
            Categories
          </Text>
          <CategoryChips
            items={CATEGORIES}
            selectedKey={selectedCategory}
            onSelect={(key) => setQueryParams({ category: key === 'all' ? undefined : key, search: searchParam })}
            style={{ marginTop: theme.spacing.md }}
          />
        </View>

        {hasActiveFilters ? (
          <Card variant="bordered" style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: theme.typography.body }}>
              Active filters
            </Text>
            <Text style={{ color: theme.colors.mutedForeground, fontWeight: '500', fontSize: theme.typography.bodySmall }}>
              {selectedCategory !== 'all' ? `Category: ${selectedCategory}` : 'Category: All'}
              {searchParam ? ` • Search: "${searchParam}"` : ''}
            </Text>
            <Button
              label="Clear filters"
              variant="outline"
              size="sm"
              onPress={() => setQueryParams({ search: undefined, category: undefined })}
            />
          </Card>
        ) : null}

        {isLoading && page === 1 ? (
          skeletonGrid
        ) : error ? (
          <Card variant="bordered" style={{ gap: theme.spacing.md, padding: theme.spacing.lg, alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.dangerMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="alert-circle" size={28} color={theme.colors.danger} />
            </View>
            <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h4 }}>
                Couldn't load products
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, fontWeight: '500', textAlign: 'center' }}>
                {getApiErrorMessage(error)}
              </Text>
            </View>
            <Button label="Try Again" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : items.length === 0 ? (
          <Card variant="bordered" style={{ gap: theme.spacing.md, padding: theme.spacing.lg, alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="search" size={28} color={theme.colors.mutedForeground} />
            </View>
            <View style={{ gap: theme.spacing.xs, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h4 }}>
                No products found
              </Text>
              <Text style={{ color: theme.colors.mutedForeground, fontWeight: '500', textAlign: 'center' }}>
                Try adjusting your search or clearing filters
              </Text>
            </View>
            <Button label="Clear filters" variant="outline" onPress={() => setQueryParams({})} />
          </Card>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={keyExtractor}
              renderItem={renderProduct}
              numColumns={2}
              scrollEnabled={false}
            />

            {isFetching && page > 1 ? (
              <View style={{ paddingVertical: theme.spacing.md }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null}

            {canLoadMore ? (
              <Button
                label="Load more"
                variant="outline"
                onPress={() => setPage((p) => p + 1)}
                disabled={isFetching}
              />
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
