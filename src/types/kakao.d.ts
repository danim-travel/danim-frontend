declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number, options?: { animate: boolean | { duration: number } }): void;
      getLevel(): number;
      panTo(latlng: LatLng): void;
      getBounds(): LatLngBounds;
      setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
    }

    namespace event {
      function addListener(target: object, type: string, handler: () => void): void;
      function removeListener(target: object, type: string, handler: () => void): void;
    }

    namespace services {
      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlaceItem[], status: Status, pagination: Pagination) => void,
          options?: PlaceSearchOptions
        ): void;
      }

      interface PlaceItem {
        id: string;
        place_name: string;
        category_name: string;
        category_group_code: string;
        category_group_name: string;
        phone: string;
        address_name: string;
        road_address_name: string;
        x: string;
        y: string;
        place_url: string;
        distance: string;
      }

      const enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }

      interface Pagination {
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        current: number;
        gotoPage(page: number): void;
        nextPage(): void;
        prevPage(): void;
      }

      interface PlaceSearchOptions {
        category_group_code?: string;
        x?: number;
        y?: number;
        radius?: number;
        size?: number;
        page?: number;
        sort?: "accuracy" | "distance";
      }
    }

    interface MapOptions {
      center: LatLng;
      level?: number;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
    }

    interface CustomOverlayOptions {
      position: LatLng;
      content: string | HTMLElement;
      map?: Map;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
    }

    interface PolylineOptions {
      path: LatLng[];
      map?: Map;
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeStyle?: string;
    }
  }
}
