import * as dotenv from "dotenv";

dotenv.config();

interface FilterObject {
  conjunction: string;
  filterSet: Array<{
    fieldId: string;
    operator: string;
    value: any;
  }>;
}

interface RecordResponse {
  records: Array<Record<string, any>>;
}

interface CreateRecordsResponse {
  records: Array<{
    id: string;
    fields: Record<string, any>;
    [key: string]: any;
  }>;
}

const TEABLE_CONFIG = {
  API_KEY: process.env.TEABLE_API_KEY,
  API_URL: process.env.TEABLE_API_URL,
};

export class TeableClient {
  private token?: string;

  constructor() {
    this.token = TEABLE_CONFIG.API_KEY;
    if (!this.token) {
      throw new Error("API key is required");
    }
  }

  // using unknown type that is safer than any
  private async makeRequest<TBody = unknown, TResponse = unknown>(
    endpoint: string,
    method: string,
    body?: TBody
  ): Promise<TResponse> {
    try {
      const response = await fetch(`${TEABLE_CONFIG.API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error response: ${errorText}`);
        throw new Error(
          `API request failed: ${errorText || response.statusText}`
        );
      }

      return await response.json();
    } catch (e) {
      console.error(`Error in API request: ${e}`);
      throw e;
    }
  }

  async get_records(
    table_id: string,
    filter_obj: FilterObject | null = null,
    take: number | null = null,
    skip: number | null = null
  ) {
    let queryParams = new URLSearchParams();
    queryParams.append("fieldKeyType", "name");

    if (filter_obj) {
      queryParams.append("filter", JSON.stringify(filter_obj));
    }

    if (take !== null) {
      queryParams.append("take", take.toString());
    }

    if (skip !== null) {
      queryParams.append("skip", skip.toString());
    }

    const endpoint = `/table/${table_id}/record?${queryParams.toString()}`;
    const response = await this.makeRequest<null, RecordResponse>(
      endpoint,
      "GET"
    );
    return response.records || [];
  }

  async get_record(table_id: string, record_id: string) {
    const endpoint = `/table/${table_id}/record/${record_id}`;
    return await this.makeRequest(endpoint, "GET");
  }

  async create_record(table_id: string, fields: Record<string, any>) {
    const endpoint = `/table/${table_id}/record?fieldKeyType=name&typecast=true`;
    return await this.makeRequest(endpoint, "POST", { records: [{ fields }] });
  }

  async update_record(
    table_id: string,
    record_id: string,
    fields: Record<string, any>
  ) {
    const endpoint = `/table/${table_id}/record/${record_id}?fieldKeyType=name&typecast=true`;
    return await this.makeRequest(endpoint, "PATCH", { record: { fields } });
  }

  async create_records(
    table_id: string,
    records: Array<Record<string, any>>,
    field_key_type: string = "name",
    typecast: boolean = true
  ) {
    const endpoint = `/table/${table_id}/record?fieldKeyType=${field_key_type}`;
    const formattedRecords = records.map((record) => ({ fields: record }));

    const params = {
      records: formattedRecords,
      typecast,
    };

    const response = await this.makeRequest<
      typeof params,
      CreateRecordsResponse
    >(endpoint, "POST", params);

    return {
      successful: response.records || [],
      get_field_value: (field: string) =>
        response.records ? response.records[0][field] : null,
    };
  }
}
