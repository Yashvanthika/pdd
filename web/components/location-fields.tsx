'use client';

import { useMemo } from 'react';
import { getCities, getDistricts, getStates } from '../../src/data/indiaLocations';
import { Input, Select } from './ui';

interface LocationFieldsProps {
  city: string;
  district: string;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onStateChange: (value: string) => void;
  state: string;
}

export function LocationFields({ city, district, onCityChange, onDistrictChange, onStateChange, state }: LocationFieldsProps) {
  const states = useMemo(() => getStates(), []);
  const districts = useMemo(() => (state ? getDistricts(state) as string[] : []), [state]);
  const cities = useMemo(() => (state && district ? getCities(state, district) : []), [district, state]);

  return (
    <>
      <Input disabled label="Country" value="INDIA" />
      <Select
        label="State"
        onChange={(event) => {
          onStateChange(event.target.value);
          onDistrictChange('');
          onCityChange('');
        }}
        options={states}
        value={state}
      />
      <Select
        disabled={!state}
        label="District"
        onChange={(event) => {
          onDistrictChange(event.target.value);
          onCityChange('');
        }}
        options={districts}
        value={district}
      />
      <Select
        disabled={!district}
        label="City"
        onChange={(event) => onCityChange(event.target.value)}
        options={cities}
        value={city}
      />
    </>
  );
}
