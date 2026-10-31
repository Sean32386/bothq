# Credits

## NVIDIA SimReady assets (CC BY 4.0)

The following 3D models are derived from NVIDIA SimReady assets
(https://huggingface.co/datasets/nvidia/simready-assets), © NVIDIA Corporation,
licensed under Creative Commons Attribution 4.0 International
(https://creativecommons.org/licenses/by/4.0/).

Modifications: converted from USD (OmniPBR) to glTF 2.0, physics/collision data removed,
materials approximated as glTF PBR, UVs rescaled, textures resized to 512/1024 px WebP,
meshes meshopt-compressed; some exported without normals.

- `assets/models/opt/sr_TV_a01.glb` (from TV_a01)
- `assets/models/opt/sr_appliance_toaster_a01.glb` (from appliance_toaster_a01)
- `assets/models/opt/sr_bin_waste_a01.glb` (from bin_waste_a01)
- `assets/models/opt/sr_book_open_a01.glb` (from book_open_a01)
- `assets/models/opt/sr_chair_office_fabric_manager_a01.glb` (from chair_office_fabric_manager_a01)
- `assets/models/opt/sr_computer_keyboard_a01.glb` (from computer_keyboard_a01)
- `assets/models/opt/sr_computer_monitor_office_a01.glb` (from computer_monitor_office_a01)
- `assets/models/opt/sr_computer_mouse_office_b01.glb` (from computer_mouse_office_b01)
- `assets/models/opt/sr_decor_candle_a01.glb` (from decor_candle_a01)
- `assets/models/opt/sr_dishware_bowl_a01.glb` (from dishware_bowl_a01)
- `assets/models/opt/sr_dishware_glass_tumbler_a01.glb` (from dishware_glass_tumbler_a01)
- `assets/models/opt/sr_dishware_mug_coffee_a01.glb` (from dishware_mug_coffee_a01)
- `assets/models/opt/sr_food_beverage_coffeeCup_a01.glb` (from food_beverage_coffeeCup_a01)
- `assets/models/opt/sr_furniture_table_coffee_low_a01.glb` (from furniture_table_coffee_low_a01)
- `assets/models/opt/sr_kitchenware_kettle_a01.glb` (from kitchenware_kettle_a01)
- `assets/models/opt/sr_lamp_table_bedside_a01.glb` (from lamp_table_bedside_a01)
- `assets/models/opt/sr_measurement_clock_alarm_a01.glb` (from measurement_clock_alarm_a01)
- `assets/models/opt/sr_misc_glass_vase_a01.glb` (from misc_glass_vase_a01)
- `assets/models/opt/sr_misc_notebook_a01.glb` (from misc_notebook_a01)
- `assets/models/opt/sr_refrigerator_a01.glb` (from refrigerator_a01)
- `assets/models/opt/sr_sofa_soft_b01.glb` (from sofa_soft_b01)
- `assets/models/opt/sr_sofa_visitor_a01.glb` (from sofa_visitor_a01)
- `assets/models/opt/sr_storage_shelf_basic_a01.glb` (from storage_shelf_basic_a01)

## Other assets
Other textures, HDRIs and models are CC0 (Poly Haven / ambientCG) unless noted.

## 2K PBR surface materials (CC0)
- Poly Haven (CC0, https://polyhaven.com/license): herringbone_parquet (floor), concrete_wall_008 (walls), grey_plaster (upper walls), marble_01 (coffee bar top), poly_wool_herringbone (rugs)
- ambientCG (CC0, https://ambientcg.com): Moss002 (plant walls)
- Poly Haven (CC0) models: metal_stool_02 (bar stools), hanging_industrial_lamp (bar pendants), potted_plant_01, fern_02
- Wall art prints: crops of Poly Haven CC0 HDRI photos (alps_field, autumn_hill_view, aarfontein_sunrise)
- Espresso machine: "Two group espresso machine" from 3dassets.dev, CC0 1.0 (contributor reports it was AI-generated, not scanned), meshopt-compressed

## Realistic character pilot (`?realchar`, desktop only)
- Sage body: "Body Female - Realistic" from Blender Studio **Human Base Meshes** bundle v1.4.1 — **CC0** (per blender.org demo-files page). Re-rigged (custom 17-bone skeleton, distance-based weights), recoloured and meshopt-compressed by Bot HQ. Hair cards, skin/eye shading are procedural (no third-party textures).

### Sage realistic pilot (round 4, `?realchar`)
- Skin albedo/roughness/normal maps (`assets/tex/skin_*.webp`): procedurally generated and baked in Blender (noise/voronoi), no third-party textures.
- Figure shaping (hourglass silhouette), modelled blazer/shirt/trousers/shoe shells: authored for Bot HQ in Blender on top of the CC0 Human Base Meshes body.
- Eyes (iris canvas texture, cornea) and strand hair: generated in code at runtime.

## Art by Pixel (Bot HQ's graphics & visual design artist)
Original AI-generated artwork made by Pixel for Bot HQ; license: `art/textures/LICENSE.md` (original work, free to use, modify and publish in Bot HQ; no third-party material, logos or real-person likenesses).
- Wall posters (`assets/tex/artp_*.webp`): "As for me and my house, we will serve the LORD" (Joshua 24:15), "Family First", "Teamwork - Together We Build". The faith poster is cropped to its framed artwork; the other two are used full-bleed.
- Character art direction and reference sheets for every bot (`art/<bot>/art_direction.md`, `refsheet.png`). Sage's realistic wrap dress and white sneakers are modelled from Pixel's `art/sage/refsheet.png`.
- Pixel's own look (pixie-fairy elf artist: elf ears, iridescent wings, beret) follows her art direction.

## Sage `?realchar2` model (`assets/models/opt/realchar2_sage.glb`)
- Visual target: Pixel's refsheet `art/sage/refsheet.png`.
- Base shape: generated from the refsheet's front view with **Hunyuan3D-2** (Tencent, `hunyuan3d-dit-v2-0`, via the public `tencent/Hunyuan3D-2` Space, shape only). Licence: Tencent Hunyuan 3D 2.0 Community License. It does **not** grant rights in the EU, UK or South Korea, and products above 1M monthly active users need a separate licence from Tencent.
- Texture: our own orthographic projection of the refsheet front and side views, baked in Blender (`realchar2/build_gen.py`). Hunyuan's texture model was not used.
- Rig: same 17-bone skeleton as `?realchar`, with Blender automatic weights. Compressed with gltf-transform (WebP + meshopt).
