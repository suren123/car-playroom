'use client';
import {createContext} from 'react';
import type {PreparedResource} from '../lib/resource-loader';
export const GameResourceContext=createContext<ReadonlyMap<string,PreparedResource>|null>(null);
