/* eslint "@typescript-eslint/indent": "off" */
/* eslint "no-tabs": "off" */
import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import { type LayerStyleOptions } from "./map";
import { type FeatureCollection } from "geojson";
export interface GeoServerFeatureType {
  featureType: {
    name: string;
    nativeName: string;
    namespace: {
      name: string;
      href: string;
    };
    title: string;
    abstract: string;
    keywords: {
      string: string[];
    };
    nativeCRS: string;
    srs: string;
    nativeBoundingBox: {
      minx: number;
      maxx: number;
      miny: number;
      maxy: number;
      crs: string;
    };
    latLonBoundingBox: {
      minx: number;
      maxx: number;
      miny: number;
      maxy: number;
      crs: string;
    };
    projectionPolicy: string;
    enabled: boolean;
    store: {
      "@class": string;
      name: string;
      href: string;
    };
    serviceConfiguration: boolean;
    simpleConversionEnabled: boolean;
    internationalTitle: string;
    internationalAbstract: string;
    maxFeatures: number;
    numDecimals: number;
    padWithZeros: boolean;
    forcedDecimal: boolean;
    overridingServiceSRS: boolean;
    skipNumberMatched: boolean;
    circularArcPresent: boolean;
    attributes: {
      attribute: GeoServerFeatureTypeAttribute[];
    };
  };
}
export interface GeoServerFeatureTypeAttribute {
  name: string;
  minOccurs?: number;
  maxOccurs?: number;
  nillable?: boolean;
  binding: string;
}
export interface GeoserverLayerInfo {
  name: string;
  type: string;
  defaultStyle: {
    name: string;
    href: string;
  };
  resource: {
    "@class": string;
    name: string;
    href: string;
  };
  attribution: {
    logoWidth: number;
    logoHeight: number;
  };
  dateCreated: string;
  dateModified: string;
  styles: StyleList
}
export interface StyleEntry {
  name: string;
  href: string;
}

export interface StyleList {
  "@class": string;
  style: StyleEntry[];
}
export interface GeoserverLayerInfoResponse {
  layer: GeoserverLayerInfo;
}
export interface GeoserverLayerListItem {
  name: string;
  href: string;
}
export interface GeoserverLayerListResponse {
  layers: {
    layer: GeoserverLayerListItem[];
  };
}
export interface WorkspaceListItem {
  name: string;
  href: string;
}
export interface WorkspaceListResponse {
  workspaces: {
    workspace: WorkspaceListItem[];
  };
}
export const useGeoserverStore = defineStore("geoserver", () => {
  const pointData = ref();
  const auth = btoa(
    `${
      import.meta.env.VITE_GEOSERVER_USERNAME +
      ":" +
      import.meta.env.VITE_GEOSERVER_PASSWORD
    }`
  );
  const layerList = ref<GeoserverLayerListItem[]>();
  const workspaceList = ref<WorkspaceListItem[]>();
  async function getLayerDataGeoJSON(layer: string, workspace: string, bbox: string): Promise<FeatureCollection> {
    const url = new URL(
      `${import.meta.env.VITE_GEOSERVER_BASE_URL}/${workspace}/wms?service=WMS&version=1.1.0&request=GetMap&layers=${workspace}:${layer}&bbox=${bbox}&width=512&height=512&srs=EPSG:4326&format=geojson&styles=`
    );
    if (workspace === undefined || workspace === "") {
      throw new Error("Workspace is required");
    }
    if (layer === undefined || layer === "") {
      throw new Error("Layer is required");
    }
    if (bbox === undefined || bbox === "") {
      throw new Error("Bounding box is required");
    }
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      }),
    });
    return await response.json();
  }
  /**
   * Gets layer list from geoserver. If optional workspace argument used it returns only layer list under this workspace.
   * @returns
   */
  async function getLayerList(
    workspaceName?: string
  ): Promise<GeoserverLayerListResponse> {
    let url = new URL(`${import.meta.env.VITE_GEOSERVER_REST_URL}/layers`);
    /* eslint-disable */
    if (workspaceName) {
      url = new URL(
        `${
          import.meta.env.VITE_GEOSERVER_REST_URL
        }/workspaces/${workspaceName}/layers`
      );
    }
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      }),
    });
    return await response.json();
  }
  /**
   * Lists all workspaces user has access in geoserver.
   * @returns
   */
  async function getWorkspaceList(): Promise<WorkspaceListResponse> {
    const url = new URL(
      `${import.meta.env.VITE_GEOSERVER_REST_URL}/workspaces`
    );
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      }),
    });
    return await response.json();
  }
  /**
   * Retrieves layer information based on GeoserverLayerInfo.
   *
   * @param layer - The layer for which to retrieve information.
   * @param workspace - The workspace in which the layer is located.
   * @returns - A Promise resolving to the JSON representation of the layer information.
   */
  async function getLayerInformation(
    layer: GeoserverLayerListItem,
    workspace: string
  ): Promise<GeoserverLayerInfoResponse> {
    const url = new URL(
      `${
        import.meta.env.VITE_GEOSERVER_REST_URL
      }/workspaces/${workspace}/layers/${layer.name}`
    );
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      }),
    });
    return await response.json();
  }
  /**
   * Retrieves detailed layer information.
   *
   * @param url - Resource.href from GeoserverLayerInfo
   * @returns - A Promise resolving to the JSON representation of the layer detailed information.
   */
  async function getLayerDetail(url: string): Promise<GeoServerFeatureType> {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      }),
    });
    return await response.json();
  }
  /**
   * Retrieves layer styling object from geoserver
   * @param url - url of style from geoserver
   * @returns - Style object
   */
  async function getLayerStyling(url:string):Promise<any> {
    const response = await fetch(url,{
      method: "GET",
      redirect: "follow",
      headers: new Headers({
        "Content-Type": "application/vnd.geoserver.mbstyle+json",
        Authorization: `Basic ${auth}`,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to fetch layer styling.");
    }
    return await response.json()
  }
  /**
   * Converts a GeoServer style object to a Maplibre-compatible style options object.
   * @param geoserverStyling - The style object from GeoServer.
   * @returns The converted LayerStyleOptions object for Maplibre.
   */
  function convertLayerStylingToMaplibreStyle(geoserverStyling:any):LayerStyleOptions{
    const obj: LayerStyleOptions = {
      paint:{ ...geoserverStyling.layers[0].paint }
    }
    if (Object.prototype.hasOwnProperty.call(geoserverStyling.layers[0] as LayerStyleOptions, "layout")){
        obj.layout = geoserverStyling.layers[0].layout
    }
    if (Object.prototype.hasOwnProperty.call(geoserverStyling.layers[0] as LayerStyleOptions, "minzoom")){
        obj.minzoom = geoserverStyling.layers[0].minzoom
    }
    if (Object.prototype.hasOwnProperty.call(geoserverStyling.layers[0] as LayerStyleOptions, "maxzoom")){
        obj.maxzoom = geoserverStyling.layers[0].maxzoom
    }
    return obj
  }
  return {
    pointData,
    layerList,
    workspaceList,
    getLayerDataGeoJSON,
    getLayerList,
    getWorkspaceList,
    getLayerInformation,
    getLayerDetail,
    getLayerStyling,
    convertLayerStylingToMaplibreStyle
  };
});
/* eslint-disable */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeoserverStore, import.meta.hot));
}
