#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Script to export all visible layers to their own files, for ease
# of designing captchas.

import os
import re
from gimpfu import *

OUTPUT_DIR = "/Users/michael/coding/specialducklivery/frontend/public/captcha/frog"


def collect_visible_layers(layers):
    """Recursively collect visible layers, descending into visible groups."""
    result = []
    for layer in layers:
        if not pdb.gimp_item_get_visible(layer):
            continue
        if pdb.gimp_item_is_group(layer):
            result.extend(collect_visible_layers(layer.children))
        else:
            result.append(layer)
    return result


def safe_name(name):
    name = re.sub(r'[\\/:*?"<>|]', "_", name).strip()
    return name or "layer"


def export_visible_layers(image, drawable):
    if not os.path.isdir(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    layers = collect_visible_layers(image.layers)
    used = {}
    count = 0

    pdb.gimp_progress_init("Exporting layers...", None)

    for i, layer in enumerate(layers):
        base = safe_name(layer.name)

        # Avoid overwriting when two layers share a name
        if base in used:
            used[base] += 1
            filename = "%s_%d.png" % (base, used[base])
        else:
            used[base] = 0
            filename = base + ".png"

        path = os.path.join(OUTPUT_DIR, filename)

        # Temporary image at the full canvas size
        tmp = pdb.gimp_image_new(image.width, image.height, image.base_type)
        new_layer = pdb.gimp_layer_new_from_drawable(layer, tmp)
        pdb.gimp_image_insert_layer(tmp, new_layer, None, 0)
        pdb.gimp_layer_set_offsets(new_layer, layer.offsets[0], layer.offsets[1])
        pdb.gimp_item_set_visible(new_layer, True)

        # Bake in any layer mask
        if pdb.gimp_layer_get_mask(new_layer):
            pdb.gimp_layer_remove_mask(new_layer, MASK_APPLY)

        # Expand the layer to the full canvas so the exported PNG is
        # canvas-sized, with the layer content kept at its original position
        pdb.gimp_layer_resize_to_image_size(new_layer)

        pdb.file_png_save_defaults(tmp, new_layer, path, filename)
        pdb.gimp_image_delete(tmp)

        count += 1
        pdb.gimp_progress_update(float(i + 1) / len(layers))

    pdb.gimp_message("Exported %d layer(s) to %s" % (count, OUTPUT_DIR))


register(
    "python_fu_export_visible_layers",
    "Export visible layers as PNGs",
    "Exports each visible layer to its own canvas-sized PNG, named after the layer.",
    "Michael",
    "Michael",
    "2025",
    "<Image>/Filters/Export/Export Visible Layers as PNG",
    "*",
    [],
    [],
    export_visible_layers,
)

main()