import { router } from 'expo-router';
import { HeaderBackButton, Screen, ScreenHeader } from '@/components/ui';
import { ActionsSection } from '@/features/dev/catalog/ActionsSection';
import { ContainersSection } from '@/features/dev/catalog/ContainersSection';
import { FoundationsSection } from '@/features/dev/catalog/FoundationsSection';
import { GameUpSection } from '@/features/dev/catalog/GameUpSection';
import { IllustrationsSection } from '@/features/dev/catalog/IllustrationsSection';
import { NavigationSection } from '@/features/dev/catalog/NavigationSection';
import { SpeakGamesSection } from '@/features/dev/catalog/SpeakGamesSection';
import { StudentSection } from '@/features/dev/catalog/StudentSection';
import { ThinkingGamesSection } from '@/features/dev/catalog/ThinkingGamesSection';

/** Ruta de desarrollo: muestra cada componente en todos sus estados. */
export function CatalogScreen() {
  return (
    <Screen
      header={
        <ScreenHeader
          left={<HeaderBackButton onPress={() => router.back()} />}
          title="Catálogo"
        />
      }
    >
      <FoundationsSection />
      <ActionsSection />
      <NavigationSection />
      <ContainersSection />
      <GameUpSection />
      <IllustrationsSection />
      <ThinkingGamesSection />
      <SpeakGamesSection />
      <StudentSection />
    </Screen>
  );
}
