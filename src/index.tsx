import * as React from "react";
import { registerWidget, registerLink, registerUI, IContextProvider, } from './uxp';
import { TitleBar, FilterPanel, WidgetWrapper, MapComponent, useMessageBus, useToast, Button, Modal, Select, DateTimePicker, DropDownButton, ToggleFilter, DatePicker, IconButton, Loading, DataTable, IMarker } from "uxp/components";
import './styles.scss';
import { isWhiteSpaceSingleLine, readBuilderProgram } from "typescript";
import SpaceOccupancyAnalytics from "./SpaceOccupancy";
import SpaceUtilization from "./SpaceUtilization";
import SpaceOccupancyAnalyticsDisplay from "./OccupancyCount";

interface IWidgetProps {
    uxpContext?: IContextProvider
}

/**
 * Register as a Widget
 */
registerWidget({
    id: "space-occupancy-analytics",
    name: "Space Occupancy Analytics",
    widget: SpaceOccupancyAnalytics,
    configs: {
        layout: {
            w: 19,
            h: 12,
            // minH: 12,
            // minW: 12
        }
    },
    defaultProps: {
    }
});

registerWidget({
    id: "space-occupancy-analytics-display",
    name: "Space Occupancy Analytics",
    widget: SpaceOccupancyAnalyticsDisplay,
    configs: {
        layout: {
            w: 19,
            h: 12,
            // minH: 12,
            // minW: 12
        }
    },
    defaultProps: {
    }
});

registerWidget({
    id: "space-utilization",
    name: "Space Utilization",
    widget: SpaceUtilization,
    configs: {
        layout: {
            w: 22,
            h: 12,
            // minH: 12,
            // minW: 12
        }
    },
    defaultProps: {
    }
});
