import { Injectable, Inject, Logger } from '@nestjs/common';
import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { ITEM_REPOSITORY } from '@/application/use-cases/items/create-item/create-item.use-case';

export const DEFAULT_ITEMS = [
  {
    sku: 'OLEO-5W30-SINT-1L',
    name: 'Óleo de motor 5W30 sintético',
    description: 'Óleo lubrificante sintético para motores a gasolina e flex',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 32.0,
    salePrice: 54.9,
  },
  {
    sku: 'OLEO-15W40-MIN-1L',
    name: 'Óleo de motor 15W40 mineral',
    description: 'Óleo lubrificante mineral para motores diesel',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 22.0,
    salePrice: 38.9,
  },
  {
    sku: 'FLUIDO-FREIO-DOT4-500ML',
    name: 'Fluido de freio DOT 4',
    description: 'Fluido de freio sintético DOT 4 - frasco 500ml',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.UNIT,
    cost: 18.5,
    salePrice: 34.9,
  },
  {
    sku: 'ADITIVO-RADIADOR-1L',
    name: 'Aditivo para radiador concentrado',
    description: 'Aditivo de arrefecimento de longa duração',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 19.0,
    salePrice: 36.9,
  },
  {
    sku: 'GRAXA-LITIO-1KG',
    name: 'Graxa de lítio',
    description: 'Graxa multiuso para rolamentos e articulações',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.KILOGRAM,
    cost: 28.0,
    salePrice: 49.9,
  },
  {
    sku: 'LIMPA-CONTATO-300ML',
    name: 'Limpa contato spray',
    description: 'Limpa contato elétrico e eletrônico - 300ml',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.UNIT,
    cost: 14.0,
    salePrice: 27.9,
  },
  {
    sku: 'FILTRO-OLEO-01',
    name: 'Filtro de óleo',
    description: 'Filtro de óleo do motor para veículos de passeio',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 18.0,
    salePrice: 35.0,
  },
  {
    sku: 'FILTRO-AR-01',
    name: 'Filtro de ar do motor',
    description: 'Elemento filtrante de ar do motor',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 25.0,
    salePrice: 49.0,
  },
  {
    sku: 'FILTRO-COMB-01',
    name: 'Filtro de combustível',
    description: 'Filtro de combustível para motores flex',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 22.0,
    salePrice: 45.0,
  },
  {
    sku: 'FILTRO-CABINE-01',
    name: 'Filtro de ar-condicionado',
    description: 'Filtro de cabine com carvão ativado',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 20.0,
    salePrice: 42.0,
  },
  {
    sku: 'PASTILHA-FREIO-DIANT-01',
    name: 'Pastilha de freio dianteira',
    description: 'Jogo de pastilhas de freio dianteiras',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 65.0,
    salePrice: 119.0,
  },
  {
    sku: 'DISCO-FREIO-DIANT-01',
    name: 'Disco de freio dianteiro',
    description: 'Disco de freio ventilado dianteiro',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 110.0,
    salePrice: 189.0,
  },
  {
    sku: 'AMORTECEDOR-DIANT-01',
    name: 'Amortecedor dianteiro',
    description: 'Amortecedor dianteiro pressurizado',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 180.0,
    salePrice: 299.0,
  },
  {
    sku: 'CORREIA-DENTADA-01',
    name: 'Correia dentada',
    description: 'Correia sincronizadora do motor',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 75.0,
    salePrice: 139.0,
  },
  {
    sku: 'VELA-IGNICAO-01',
    name: 'Vela de ignição',
    description: 'Vela de ignição com eletrodo de níquel',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 16.0,
    salePrice: 32.0,
  },
  {
    sku: 'BATERIA-60AH-01',
    name: 'Bateria 60Ah',
    description: 'Bateria automotiva selada 60Ah',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 320.0,
    salePrice: 489.0,
  },
  {
    sku: 'LAMPADA-H4-01',
    name: 'Lâmpada farol H4',
    description: 'Lâmpada halógena H4 12V 60/55W',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 12.0,
    salePrice: 25.0,
  },
  {
    sku: 'PALHETA-LIMPADOR-01',
    name: 'Palheta do limpador de para-brisa',
    description: 'Palheta de limpador em silicone',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 22.0,
    salePrice: 44.0,
  },
];

@Injectable()
export class ItemSeedService {
  private readonly logger = new Logger(ItemSeedService.name);

  constructor(
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
  ) {}

  async run(): Promise<void> {
    let seededCount = 0;

    for (const data of DEFAULT_ITEMS) {
      const existingItem = await this.itemRepository.findBySku(data.sku);

      if (existingItem) {
        continue;
      }

      await this.itemRepository.save(Item.create(data));
      seededCount++;
    }

    if (seededCount === 0) {
      this.logger.log('Items already seeded. Skipping.');
      return;
    }

    this.logger.log(`${seededCount} items seeded successfully.`);
  }
}
